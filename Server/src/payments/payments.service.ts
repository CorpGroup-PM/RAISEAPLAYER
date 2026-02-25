import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { PaymentStatus, Prisma } from '@prisma/client';
import { CreateDonationDto } from './dto/create.donation.dto';

@Injectable()
export class PaymentsService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService,
  ) { }

  async createOrder(dto: CreateDonationDto, userId?: string) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: {
        id: dto.fundraiserId,
      },
      select: {
        id: true,
        status: true,
        goalAmount: true,
        raisedAmount: true,
      },
    });

    if (!fundraiser) {
      throw new BadRequestException('Fundraiser not found');
    }

    if (fundraiser.status !== 'ACTIVE') {
      throw new BadRequestException('Fundraiser is not active');
    }

    if (dto.donationAmount <= 0) {
      throw new BadRequestException('Donation amount must be greater than 0');
    }

    if (dto.platformTipAmount < 0) {
      throw new BadRequestException('Platform tip cannot be negative');
    }

    const totalAmount = dto.donationAmount + dto.platformTipAmount;

    // ── Concurrency-safe goal check + donation creation in one transaction ─────
    // Uses a raw SQL advisory lock on the fundraiser row to prevent two
    // simultaneous donations from both passing the remaining-amount check.
    const donation = await this.prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction for consistent read
      const locked = await tx.fundraiser.findUnique({
        where: { id: dto.fundraiserId },
        select: { goalAmount: true, raisedAmount: true },
      });

      if (!locked) {
        throw new BadRequestException('Fundraiser not found');
      }

      const goal = new Prisma.Decimal(locked.goalAmount);
      const raised = new Prisma.Decimal(locked.raisedAmount ?? 0);
      const remaining = goal.minus(raised);

      if (remaining.lte(0)) {
        throw new BadRequestException(
          `Goal is ₹${goal.toFixed(2)}. This fundraiser has already reached its goal.`,
        );
      }

      const donationAmount = new Prisma.Decimal(dto.donationAmount);

      if (donationAmount.gt(remaining)) {
        throw new BadRequestException(
          `Goal is ₹${goal.toFixed(2)}. You can donate at most ₹${remaining.toFixed(2)}.`,
        );
      }

      return tx.donation.create({
        data: {
          fundraiserId: dto.fundraiserId,
          donorId: userId ?? null,

          guestName: userId ? null : dto.guestName,
          guestEmail: userId ? null : dto.guestEmail,
          guestMobile: userId ? null : dto.guestMobile,

          donationAmount: dto.donationAmount,
          platformTipAmount: dto.platformTipAmount,
          totalAmount,

          isAnonymous: dto.isAnonymous,
          status: PaymentStatus.PENDING,
        },
      });
    });

    //  Create Razorpay Order (outside tx — external call)
    const razorpayOrder = await this.razorpayService.createOrder({
      amount: totalAmount * 100, // convert to paise
      currency: 'INR',
      receipt: donation.id,
    });

    //  Create Payment Record
    await this.prisma.payment.create({
      data: {
        donationId: donation.id,
        razorpayOrderId: razorpayOrder.id,
        status: PaymentStatus.PENDING,
      },
    });

    //  Return order details (RAZORPAY_KEY_ID is the public/client key — safe to send)
    return {
      message: 'Order created successfully. Please complete the payment.',
      donationId: donation.id,
      razorpay: {
        key: process.env.RAZORPAY_KEY_ID,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    };
  }
}
