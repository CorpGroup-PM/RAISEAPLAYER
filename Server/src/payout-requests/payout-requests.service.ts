import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { Prisma, TransferStatus } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class PayoutRequestsService {

    constructor(private readonly prisma: PrismaService,
        private readonly mailService: MailService
    ) { }

    async createPayoutRequest(
        userId: string,
        fundraiserId: string,
        dto: CreatePayoutRequestDto,
    ) {
        // if (dto.amount < 5000) {
        //     throw new BadRequestException('Minimum withdrawal amount is ₹5000');
        // }

        //  Run transaction ONLY for DB work
        const requestId = await this.prisma.$transaction(async (tx) => {
            const fundraiser = await tx.fundraiser.findUnique({
                where: { id: fundraiserId },
                select: {
                    id: true,
                    creatorId: true,
                    raisedAmount: true,
                    recipientAccount: { select: { isVerified: true } },
                },
            });

            if (!fundraiser) {
                throw new BadRequestException('Fundraiser not found');
            }

            if (fundraiser.creatorId !== userId) {
                throw new ForbiddenException('You are not the owner of this fundraiser');
            }

            if (!fundraiser.recipientAccount?.isVerified) {
                throw new BadRequestException('Recipient account not verified');
            }

            const existingPending = await tx.fundTransferRequest.findFirst(
                {
                    where: {
                        fundraiserId,
                        status: {
                            in: [TransferStatus.PENDING, TransferStatus.APPROVED],

                        },
                    },
                    select:
                        { id: true },
                });
            if (existingPending) {
                throw new BadRequestException('You already have a pending payout request',);
            }

            const paidOutAgg = await tx.payout.aggregate({
                where: { fundraiserId },
                _sum: { amount: true },
            });

            const reservedAgg = await tx.fundTransferRequest.aggregate({
                where: {
                    fundraiserId,
                    status: { in: [TransferStatus.PENDING, TransferStatus.APPROVED] },
                },
                _sum: { amount: true },
            });

            const raised = fundraiser.raisedAmount; // Prisma Decimal
            const paidOut = paidOutAgg._sum.amount ?? new Prisma.Decimal(0);
            const reserved = reservedAgg._sum.amount ?? new Prisma.Decimal(0);

            const available = raised.minus(paidOut).minus(reserved);
            const reqAmount = new Prisma.Decimal(dto.amount);

            if (reqAmount.gt(available)) {
                throw new BadRequestException(
                    `Insufficient balance. Available: ₹${available.toFixed(2)}`,
                );
            }

            const request = await tx.fundTransferRequest.create({
                data: {
                    fundraiserId,
                    amount: dto.amount,
                    status: TransferStatus.PENDING,
                    requestedById: userId,
                    currency: 'INR',
                },
            });

            return request.id;
        });

        await this.sendPayoutEmails(requestId);

        return {
            success: true,
            message: "Payout request submitted successfully. It’s pending approval.",
            requestId,
        };
    }


    private async sendPayoutEmails(requestId: string) {
        const request = await this.prisma.fundTransferRequest.findUnique({
            where: { id: requestId },
            select: {
                id: true,
                amount: true,
                status: true,
                requestedBy: { select: { email: true, firstName: true, lastName: true } },
                fundraiser: { select: { title: true } },
            },
        });

        if (!request) return;

        // User email (best-effort)
        try {
            await this.mailService.sendPayoutRequestUserMail(request.requestedBy.email, {
                name: request.requestedBy.firstName ?? 'User',
                fundraiserTitle: request.fundraiser.title,
                amount: request.amount.toFixed(2),
                status: request.status,
            });
        } catch {
            // optional: Logger.warn(`Payout user mail failed for requestId=${requestId}`)
        }

        // Admin emails (best-effort)
        const adminEmails =
            process.env.ADMIN_EMAIL?.split(',').map((x) => x.trim()).filter(Boolean) ?? [];      
        if (!adminEmails.length) return;
        
        try {
            await this.mailService.sendPayoutRequestAdminMail(adminEmails, {
                userName: `${request.requestedBy.firstName ?? ''} ${request.requestedBy.lastName ?? ''}`.trim(),
                userEmail: request.requestedBy.email,
                fundraiserTitle: request.fundraiser.title,
                amount: request.amount.toFixed(2),
                requestId: request.id,
            });
        } catch {
            // optional: Logger.warn(`Payout admin mail failed for requestId=${requestId}`)
        }
    }


    async listPayoutRequests(userId: string, fundraiserId: string) {
        const fundraiser = await this.prisma.fundraiser.findUnique({
            where: { id: fundraiserId },
            select: { creatorId: true },
        });

        if (!fundraiser) {
            throw new BadRequestException('Fundraiser not found');
        }

        if (fundraiser.creatorId !== userId) {
            throw new ForbiddenException(
                'You are not the owner of this fundraiser',
            );
        }

        const items = await this.prisma.fundTransferRequest.findMany({
            where: { fundraiserId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                amount: true,
                status: true,
                createdAt: true,
                processedAt: true,
                reviewReason: true,
                failedReason: true,

                payout: {
                    select: {
                        transactionId: true,
                        proofImageUrl: true,
                        notes: true,
                    }
                }
            },
        });

        return {
            success: true,
            data: items.map((x) => ({
                id: x.id,
                amount: x.amount.toFixed(2),
                status: x.status,
                createdAt: x.createdAt,
                processedAt: x.processedAt,
                reviewReason: x.reviewReason,
                failedReason: x.failedReason,
                notes: x.payout?.notes ?? null,
                transactionId: x.payout?.transactionId ?? null,
                proofImageUrl: x.payout?.proofImageUrl ?? null,
            })),
        };
    }

    async cancelPayoutRequest(
        userId: string,
        fundraiserId: string,
        requestId: string,
    ) {
        //  Validate fundraiser ownership
        const fundraiser = await this.prisma.fundraiser.findUnique({
            where: { id: fundraiserId },
            select: { creatorId: true },
        });

        if (!fundraiser) {
            throw new BadRequestException('Fundraiser not found');
        }

        if (fundraiser.creatorId !== userId) {
            throw new ForbiddenException(
                'You are not the owner of this fundraiser',
            );
        }

        //  Fetch payout request
        const request = await this.prisma.fundTransferRequest.findUnique({
            where: { id: requestId },
            select: {
                id: true,
                fundraiserId: true,
                status: true,
            },
        });

        if (!request || request.fundraiserId !== fundraiserId) {
            throw new BadRequestException('Payout request not found');
        }

        //  Only allow cancel if PENDING
        if (request.status !== TransferStatus.PENDING) {
            throw new BadRequestException(
                'Only pending payout requests can be cancelled',
            );
        }

        // Update status → CANCELLED
        const updated = await this.prisma.fundTransferRequest.update({
            where: { id: requestId },
            data: {
                status: TransferStatus.CANCELLED,
            },
        });

        return {
            success: true,
            message: 'Payout request cancelled.',
            data: {
                id: updated.id,
                status: updated.status,
            },
        };
    }
}


