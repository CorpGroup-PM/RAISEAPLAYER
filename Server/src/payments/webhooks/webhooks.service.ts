import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyRazorpaySignature } from '../utility/razorpay-signature.util';
import { PaymentStatus } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';
import { ReceiptService } from 'src/receipt/receipt.service';

@Injectable()
export class WebhooksService {

    private readonly logger = new Logger(WebhooksService.name);

    constructor(private readonly prisma: PrismaService,
        private readonly mailService: MailService,
        private readonly receiptService: ReceiptService,
    ) { }

    async handleRazorpayEvent(payload: any,
        rawBody: Buffer,
        signature: string,
    ) {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

        const isValid = verifyRazorpaySignature(rawBody, signature, secret);

        if (!isValid) {
            throw new BadRequestException('Invalid Razorpay signature');
        }
        console.log(payload);

        const event = payload.event;
        console.log(event);

        if (event === 'payment.captured') {
            await this.handlePaymentCaptured(payload);
        }

        if (event === 'payment.failed') {
            await this.handlePaymentFailed(payload);
        }
    }


    private async handlePaymentCaptured(payload: any) {
        const paymentEntity = payload?.payload?.payment?.entity;
        if (!paymentEntity) return;

        const razorpayOrderId = paymentEntity.order_id;
        const razorpayPaymentId = paymentEntity.id;
        //const signature = payload.payload.payment.signature;

        // Fetch payment with REQUIRED relations
        const payment = await this.prisma.payment.findUnique({
            where: { razorpayOrderId },
            include: {
                donation: {
                    include: {
                        donor: {
                            select: {
                                email: true,
                                firstName: true,
                            },
                        },
                        fundraiser: {
                            select: {
                                id: true,
                                title: true,
                                creator: {
                                    select: {
                                        email: true,
                                        firstName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // If missing payment or already SUCCESS, exit fast
        if (!payment || payment.status === PaymentStatus.SUCCESS) {
            return;
        }

        //  Concurrency-safe idempotency:
        // Update payment ONLY if it's still PENDING.
        // If another worker already processed it, updated.count will be 0.
        const updated = await this.prisma.payment.updateMany({
            where: {
                id: payment.id,
                status: PaymentStatus.PENDING,
            },
            data: {
                razorpayPaymentId,
                status: PaymentStatus.SUCCESS,
                rawResponse: payload,
                // NOTE: do NOT store payload.payload.payment.signature (not reliable for webhooks)
                // If you want to store the verified webhook header signature, pass it into this method and store that instead.
            },
        });

        if (updated.count === 0) {
            // Already processed by another concurrent webhook
            return;
        }

        //  Now safely do dependent updates
        await this.prisma.$transaction([
            this.prisma.donation.update({
                where: { id: payment.donationId },
                data: { status: PaymentStatus.SUCCESS },
            }),

            this.prisma.fundraiser.update({
                where: { id: payment.donation.fundraiserId },
                data: {
                    raisedAmount: {
                        increment: payment.donation.donationAmount,
                    },
                },
            }),
        ]);

        // ----------------------------
        // Email → Fundraiser (NO AMOUNT)
        // ----------------------------
        try {
            await this.mailService.sendDonationReceivedMail(
                payment.donation.fundraiser.creator.email,
                {
                    fundraiserName: payment.donation.fundraiser.creator.firstName ?? 'User',
                    campaignTitle: payment.donation.fundraiser.title,
                },
            );
        } catch (error) {
            this.logger.error(
                `Failed to send donation received email for payment ${payment.id}`,
                error,
            );
        }

        // ----------------------------
        // Email → Donor (THANK YOU + RECEIPT)
        // ----------------------------
        const donorEmail = payment.donation.guestEmail ?? payment.donation.donor?.email;

        if (donorEmail) {
            try {
                const receiptPdf = await this.receiptService.generateDonationReceipt({
                    receiptNumber: `RAP-${payment.id}`,
                    donorName:
                        payment.donation.guestName ??
                        payment.donation.donor?.firstName ??
                        'Supporter',
                    donorEmail,
                    campaignTitle: payment.donation.fundraiser.title,
                    amount: payment.donation.donationAmount.toNumber(),
                    paymentId: payment.id,
                    donatedAt: payment.createdAt,
                });

                await this.mailService.sendDonorThankYouMail(donorEmail, {
                    donorName:
                        payment.donation.guestName ??
                        payment.donation.donor?.firstName ??
                        'Supporter',
                    campaignTitle: payment.donation.fundraiser.title,
                    receiptPdf,
                });
            } catch (error) {
                this.logger.error(
                    `Failed to send donor receipt email for payment ${payment.id}`,
                    error,
                );
            }
        }
    }



    private async handlePaymentFailed(payload: any) {
        const paymentEntity = payload.payload.payment.entity;
        const razorpayOrderId = paymentEntity.order_id;

        const payment = await this.prisma.payment.findUnique({
            where: { razorpayOrderId },
        });

        if (!payment || payment.status !== PaymentStatus.PENDING) {
            return;
        }

        await this.prisma.$transaction([
            this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.FAILED,
                    rawResponse: payload,
                },
            }),

            this.prisma.donation.update({
                where: { id: payment.donationId },
                data: {
                    status: PaymentStatus.FAILED,
                },
            }),
        ]);
    }

}

