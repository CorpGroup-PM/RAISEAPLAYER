import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { ReceiptService } from 'src/receipt/receipt.service';

@Injectable()
export class DonationHistoryService {
  constructor(private readonly prisma: PrismaService,
    private readonly receiptService: ReceiptService,
  ) { }

  async getUserDonations(userId: string) {
    const where = {
      donorId: userId,
      status: PaymentStatus.SUCCESS,
    };

    const donations = await this.prisma.donation.findMany({
      where,
      include: {
        fundraiser: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      total: await this.prisma.donation.count({ where }),
      items: donations.map((d) => ({
        donationId: d.id,
        fundraiserId: d.fundraiser.id,
        fundraiserTitle: d.fundraiser.title,

        donationAmount: d.donationAmount.toFixed(2),
        platformTipAmount: d.platformTipAmount.toFixed(2),
        totalPaid: d.totalAmount.toFixed(2),

        currency: d.currency,
        status: d.status,
        donatedAt: d.createdAt,

        receiptDownloadUrl: `/me/donations/${d.id}/receipt`,
      })),
    };
  }



  async generateReceiptForDonation(
    userId: string,
    donationId: string,
  ): Promise<Buffer> {
    const donation = await this.prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        donor: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
        fundraiser: {
          select: {
            title: true,
          },
        },
        payment: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    //  Ownership check
    if (donation.donorId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    //  Only successful donations get receipts
    if (donation.status !== PaymentStatus.SUCCESS) {
      throw new ForbiddenException(
        'Receipt available only for successful donations',
      );
    }

    //  USE YOUR EXISTING ReceiptService
    return this.receiptService.generateDonationReceipt({
      receiptNumber: `RAP-${donation.id}`,
      donorName: donation.donor?.firstName ?? 'Supporter',
      donorEmail: donation.donor?.email ?? '',
      campaignTitle: donation.fundraiser.title,
      amount: donation.donationAmount.toNumber(), // Decimal → number
      paymentId: donation.payment?.id ?? '',
      donatedAt: donation.createdAt,
    });
  }

}