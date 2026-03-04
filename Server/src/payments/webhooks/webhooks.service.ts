import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { verifyRazorpaySignature } from '../utility/razorpay-signature.util';
import { PaymentStatus } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';
import { ReceiptService } from 'src/receipt/receipt.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly receiptService: ReceiptService,
  ) {}

  async handleRazorpayEvent(payload: any, rawBody: Buffer, signature: string) {
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

  const payment = await this.prisma.payment.findUnique({
    where: { razorpayOrderId },
    include: {
      donation: {
        include: {
          donor: { select: { email: true, firstName: true } },
          fundraiser: {
            select: {
              id: true,
              title: true,
              creator: { select: { firstName: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!payment || payment.status === PaymentStatus.SUCCESS) return;

  const updated = await this.prisma.payment.updateMany({
    where: { id: payment.id, status: PaymentStatus.PENDING },
    data: {
      razorpayPaymentId,
      status: PaymentStatus.SUCCESS,
      rawResponse: payload,
    },
  });

  if (updated.count === 0) return;

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

  // 📩 Fundraiser notification
  await this.mailService.sendDonationReceivedMail(
    payment.donation.fundraiser.creator.email,
    {
      fundraiserName:
        payment.donation.fundraiser.creator.firstName ?? 'User',
      campaignTitle: payment.donation.fundraiser.title,
    },
  );

  const donorEmail =
    payment.donation.guestEmail ?? payment.donation.donor?.email;

  if (!donorEmail) return;

  const donorName =
    payment.donation.guestName ??
    payment.donation.donor?.firstName ??
    'Supporter';

  try {
    const receiptNumber = `RAP-DR-${new Date().getFullYear()}-${payment.id}`;

    const receiptPdf = await this.receiptService.generateDonationReceipt({
      receiptNumber,
      donorName,
      donorEmail,
      campaignTitle: payment.donation.fundraiser.title,
      fundraiserId: payment.donation.fundraiser.id,
      fundraiserOwner:
        payment.donation.fundraiser.creator.firstName ?? 'Organizer',
      amount: payment.donation.donationAmount.toNumber(),
      paymentId: razorpayPaymentId,
      donatedAt: payment.createdAt,
    });

    await this.mailService.sendDonorThankYouMail(donorEmail, {
      donorName,
      campaignTitle: payment.donation.fundraiser.title,
      receiptPdf,
    });

  } catch (error) {
    this.logger.error(
      `Failed to send donor receipt email for payment ${payment.id}`,
      error.stack,
    );
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
