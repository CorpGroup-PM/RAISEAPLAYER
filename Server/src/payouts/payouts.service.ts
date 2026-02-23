import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  private maskAccountNumber(value: string | null) {
    if (!value) return null;

    const last4 = value.slice(-4);
    return `XXXX XXXX XXXX ${last4}`;
  }

  async getPublicPayouts(fundraiserId: string) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
      select: {
        id: true,
        raisedAmount: true,
      },
    });

    if (!fundraiser) {
      throw new BadRequestException('Fundraiser not found');
    }

    //  Paid out payouts
    const payouts = await this.prisma.payout.findMany({
      where: { fundraiserId },
      orderBy: { paymentDate: 'desc' },
      select: {
        amount: true,
        currency: true,
        paymentDate: true,
        accountHolderName: true,
        maskedAccountNumber: true,
        transferredToLabel: true,
      },
    });

    //  Total paid out
    const totalPaidOut = payouts.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    //  Locked amount (PROCESSING payout requests)
    const lockedAgg = await this.prisma.fundTransferRequest.aggregate({
      where: {
        fundraiserId,
        status: 'PROCESSING',
      },
      _sum: {
        amount: true,
      },
    });

    const lockedAmount = Number(lockedAgg._sum.amount ?? 0);

    // Available amount
    const raisedAmount = Number(fundraiser.raisedAmount);
    const availableAmount =
      raisedAmount - totalPaidOut - lockedAmount;

    // Last payout date (safe because sorted DESC)
    const lastPayoutAt =
      payouts.length > 0 ? payouts[0].paymentDate : null;

    return {
      //  PUBLIC SUMMARY
      raisedAmount: raisedAmount.toFixed(2),
      totalPaidOut: totalPaidOut.toFixed(2),
      lockedAmount: lockedAmount.toFixed(2),
      availableAmount: Math.max(availableAmount, 0).toFixed(2),
      payoutCount: payouts.length,
      lastPayoutAt,

      // 🔹 PAYOUT HISTORY
      items: payouts.map((p) => ({
        date: p.paymentDate
          ? p.paymentDate.toISOString().split('T')[0]
          : null,
        amountTransferred: Number(p.amount).toFixed(2),
        currency: p.currency,
        accountHolder: p.accountHolderName,
        accountDetails: this.maskAccountNumber(
          p.maskedAccountNumber,
        ),
        transferredTo: p.transferredToLabel,
      })),
    };
  }
}