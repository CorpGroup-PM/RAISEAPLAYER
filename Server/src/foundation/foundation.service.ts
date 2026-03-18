import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RazorpayService } from 'src/payments/razorpay.service';
import { CreateFoundationDonationDto } from './dto/create-foundation-donation.dto';

@Injectable()
export class FoundationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService,
  ) {}

  async createOrder(dto: CreateFoundationDonationDto, userId?: string) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Fetch donor name for registered users
    let donorName: string | null = null;
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      if (user) {
        donorName = [user.firstName, user.lastName].filter(Boolean).join(' ');
      }
    }

    const donation = await this.prisma.foundationDonation.create({
      data: {
        donorId: userId ?? null,
        donorName: userId ? donorName : null,
        guestName: userId ? null : dto.guestName ?? null,
        guestEmail: userId ? null : dto.guestEmail ?? null,
        guestMobile: userId ? null : dto.guestMobile ?? null,
        amount: dto.amount,
        status: PaymentStatus.PENDING,
      },
    });

    const razorpayOrder = await this.razorpayService.createOrder({
      amount: dto.amount * 100, // paise
      currency: 'INR',
      receipt: donation.id,
    });

    await this.prisma.foundationPayment.create({
      data: {
        donationId: donation.id,
        razorpayOrderId: razorpayOrder.id,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      message: 'Foundation donation order created. Please complete the payment.',
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
