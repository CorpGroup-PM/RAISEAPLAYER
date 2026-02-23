import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProcessPayoutDto } from './dto/process-payout.dto';
import { TransferStatus } from '@prisma/client';
import { AwsS3Service } from 'src/aws/aws.service';
import { StatusPayoutRequestDto } from './dto/status-payout-request.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AdminPayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsS3Service: AwsS3Service,
    private readonly mailService: MailService,
  ) { }

  async processPayout(
    adminUserId: string,
    requestId: string,
    dto: ProcessPayoutDto,
    proofImage?: Express.Multer.File,
  ) {
    let proofImageUrl: string | null = null;

    if (proofImage) {
      proofImageUrl = await this.awsS3Service.uploadProfileImage(
        proofImage,
        'payout-proofs',
      );
    }

    //  Run transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.fundTransferRequest.findUnique({
        where: { id: requestId },
        include: {
          fundraiser: {
            include: {
              recipientAccount: true,
              creator: {
                select: {
                  email: true,
                  firstName: true,
                },
              },
            },
          },
        },
      });

      if (!request) {
        throw new NotFoundException('Payout request not found');
      }

      // Idempotent retry
      if (
        request.status === TransferStatus.PAID &&
        request.idempotencyKey === dto.idempotencyKey &&
        request.payoutId
      ) {
        return {
          alreadyPaid: true,
          request,
        };
      }

      if (request.status !== TransferStatus.PROCESSING) {
        throw new BadRequestException(
          'Only processing payout requests can be paid',
        );
      }

      const recipient = request.fundraiser.recipientAccount;
      if (!recipient || !recipient.isVerified) {
        throw new BadRequestException('Recipient account not verified');
      }

      const payout = await tx.payout.create({
        data: {
          fundraiserId: request.fundraiserId,
          amount: request.amount,
          currency: 'INR',
          accountHolderName: `${recipient.firstName} ${recipient.lastName}`,
          maskedAccountNumber: recipient.accountNumber.slice(-4),
          transferredToLabel:
            recipient.recipientType === 'PARENT_GUARDIAN'
              ? 'Family Member'
              : recipient.recipientType,
          bankName: recipient.bankName,
          ifscCode: recipient.ifscCode,
          transactionId: dto.transactionId,
          paymentDate: new Date(dto.paymentDate),
          notes: dto.notes,
          proofImageUrl,
          processedById: adminUserId,
        },
      });

      await tx.fundTransferRequest.update({
        where: { id: requestId },
        data: {
          status: TransferStatus.PAID,
          processedAt: new Date(),
          payoutId: payout.id,
          idempotencyKey: dto.idempotencyKey,
        },
      });

      return {
        alreadyPaid: false,
        request,
        payout,
      };
    });

    // Send email OUTSIDE transaction
    if (!result.alreadyPaid) {
      const creator = result.request.fundraiser.creator;

      if (creator?.email) {
        await this.mailService.sendPayoutPaidMail(
          creator.email,
          {
            name: creator.firstName ?? 'User',
            fundraiserTitle: result.request.fundraiser.title,
            amount: result.request.amount.toFixed(2),
            transactionId: dto.transactionId,
          },
        );
      }
    }

    return {
      transactionId: dto.transactionId,
      requestId,
      status: 'PAID',
      proofImageUrl,
      message: result.alreadyPaid
        ? 'Payout already processed.'
        : 'Payout processed successfully.',
    };
  }


  //
  //List of payouts
  //
  async listPayoutRequests(params: {
    status?: TransferStatus;
    fundraiserId?: string;
    page: number;
    limit: number;
  }) {
    const {
      status,
      fundraiserId,
      page,
      limit,
    } = params;

    const take = Math.min(limit || 20, 50);
    const skip = (page || 0) * take;

    const where: any = {};
    if (status) where.status = status;
    if (fundraiserId) where.fundraiserId = fundraiserId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.fundTransferRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          fundraiserId: true,
          amount: true,
          status: true,
          createdAt: true,
          reviewReason: true,
          failedReason: true,
          processedAt: true,

          fundraiser: {
            select: {
              title: true,
              creator: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              recipientAccount: {
                select: {
                  isVerified: true,
                },
              },
            },
          },
          payout: {
            select: {
              proofImageUrl: true,
              notes: true,
            },
          },
        },
      }),

      this.prisma.fundTransferRequest.count({ where }),
    ]);

    return {
      success: true,
      data: {
        page,
        limit: take,
        total,
        items: items.map((r) => ({
          fundraiserId: r.fundraiserId,
          fundraiserTitle: r.fundraiser.title,
          creator: {
            id: r.fundraiser.creator.id,
            name: `${r.fundraiser.creator.firstName ?? ''} ${r.fundraiser.creator.lastName ?? ''}`.trim(),
            email: r.fundraiser.creator.email,
          },
          requestId: r.id,
          amount: r.amount.toFixed(2),
          status: r.status,
          reviewReason: r.reviewReason,
          failReason: r.failedReason,
          proofImageUrl: r.payout?.proofImageUrl ?? null,
          notes: r.payout?.notes ?? null,
          processedAt: r.processedAt,
          createdAt: r.createdAt,
          recipientAccountVerified:
            r.fundraiser.recipientAccount?.isVerified ?? false,
        })),
      },
    };
  }


  //
  //Get all List with status
  //
  async listPayoutWithStatus(status?: TransferStatus) {
    const where: any = {};

    if (status) {
      where.status = {
        equals: status,
      };
    }

    const payouts = await this.prisma.fundTransferRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fundraiserId: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        processedAt:true,
        failedReason:true,
        reviewReason: true,
        

        payout:{
          select:{
            proofImageUrl:true,
            notes: true,
          },
        },

        fundraiser: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return {
      success: true,
      count: payouts.length,
      data: payouts,
    };
  }


  //
  //Approved payouts
  //
  async approvePayoutRequest(
    adminId: string,
    requestId: string,
  ) {
    const request = await this.prisma.fundTransferRequest.findUnique({
      where: { id: requestId },
      include: {
        fundraiser: {
          select: {
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
    });


    //  Validate existence
    if (!request) {
      throw new NotFoundException('Payout request not found');
    }

    //  Validate relation safety
    if (!request.fundraiser?.creator?.email) {
      throw new BadRequestException(
        'Fundraiser creator email not found',
      );
    }


    if (!request.fundraiser?.title) {
      throw new BadRequestException('Fundraiser details missing');
    }

    //  Status validation
    if (request.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        'Only pending payout requests can be approved',
      );
    }

    //  Approve payout
    const updated = await this.prisma.fundTransferRequest.update({
      where: { id: requestId },
      data: {
        status: TransferStatus.APPROVED,
        reviewedById: adminId,
      },
    });

    // Send email (safe)
    await this.mailService.sendPayoutApprovedMail(
      request.fundraiser.creator.email,
      {
        name: request.fundraiser.creator.firstName ?? 'User',
        fundraiserTitle: request.fundraiser.title,
        amount: request.amount.toFixed(2),
      },
    );

    return {
      success: true,
      message: 'Payout request approved.',
      data: {
        id: updated.id,
        status: updated.status,
      },
    };
  }

  //reject
  async rejectPayoutRequest(
    adminId: string,
    requestId: string,
    dto: StatusPayoutRequestDto,
  ) {
    const request = await this.prisma.fundTransferRequest.findUnique({
      where: { id: requestId },
      include: {
        fundraiser: {
          select: {
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
    });

    //  Validate existence
    if (!request) {
      throw new NotFoundException('Payout request not found');
    }

    //  Validate status
    if (
      request.status !== TransferStatus.PENDING &&
      request.status !== TransferStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Only pending or approved payout requests can be rejected',
      );
    }

    //  Validate creator email (CRITICAL)
    if (!request.fundraiser?.creator?.email) {
      throw new BadRequestException(
        'Fundraiser creator email not found',
      );
    }

    // Reject payout
    const updated = await this.prisma.fundTransferRequest.update({
      where: { id: requestId },
      data: {
        status: TransferStatus.REJECTED,
        reviewedById: adminId,
        reviewReason: dto.reason,
      },
    });

    //  Send rejection email (SAFE)
    await this.mailService.sendPayoutRejectedMail(
      request.fundraiser.creator.email,
      {
        name: request.fundraiser.creator.firstName ?? 'User',
        fundraiserTitle: request.fundraiser.title,
        amount: request.amount.toFixed(2),
        reason: dto.reason,
      },
    );

    return {
      success: true,
      message: 'Payout request rejected.',
      data: {
        id: updated.id,
        status: updated.status,
        reviewReason: updated.reviewReason,
      },
    };
  }


  //
  //fail
  //
  async failPayoutRequest(
    adminId: string,
    requestId: string,
    dto: StatusPayoutRequestDto,
  ) {
    if (!adminId) {
      throw new ForbiddenException('Admin access required');
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('Failed reason is required');
    }

    const request = await this.prisma.fundTransferRequest.findUnique({
      where: { id: requestId },
      include: {
        fundraiser: {
          select: {
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
    });

    // Validate existence
    if (!request) {
      throw new NotFoundException('Payout request not found');
    }

    //  Status validation
    if (request.status !== TransferStatus.PROCESSING) {
      throw new BadRequestException(
        'Only processing payout requests can be failed',
      );
    }

    //  Validate creator email (CRITICAL)
    if (!request.fundraiser?.creator?.email) {
      throw new BadRequestException(
        'Fundraiser creator email not found',
      );
    }

    //  Send FAILED email (SAFE)
    await this.mailService.sendPayoutFailedMail(
      request.fundraiser.creator.email,
      {
        name: request.fundraiser.creator.firstName ?? 'User',
        fundraiserTitle: request.fundraiser.title,
        amount: request.amount.toFixed(2),
        reason: dto.reason.trim(),
      },
    );

    // Update status
    const updated = await this.prisma.fundTransferRequest.update({
      where: { id: requestId },
      data: {
        status: TransferStatus.FAILED,
        failedReason: dto.reason.trim(),
        reviewedById: adminId,
        processedAt: new Date(),
      },
    });

    return {
      message: 'Fund transfer marked as failed.',
      data: updated,
    };
  }



  async processingPayoutRequest(
    adminId: string,
    requestId: string,
  ) {
    const request = await this.prisma.fundTransferRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
      },
    });

    //  Validate existence
    if (!request) {
      throw new NotFoundException('Payout request not found');
    }

    //  Status validation
    if (request.status !== TransferStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved payout requests can be moved to processing',
      );
    }

    //  Move to PROCESSING
    const updated = await this.prisma.fundTransferRequest.update({
      where: { id: requestId },
      data: {
        status: TransferStatus.PROCESSING,
        reviewedById: adminId,
      },
    });

    return {
      success: true,
      message: 'Payout request moved to processing.',
      data: {
        id: updated.id,
        status: updated.status,
      },
    };
  }

}
