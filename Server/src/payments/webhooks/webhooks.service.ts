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

    const event = payload.event;
    this.logger.log(`Razorpay webhook received: ${event}`);

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

  // Fast-path: already fully processed (late Razorpay retry)
  if (!payment || payment.status === PaymentStatus.SUCCESS) return;

  // ── Single atomic transaction: idempotency guard + donation + fundraiser ──
  // All three writes succeed or all roll back together, eliminating the gap
  // where payment = SUCCESS but raisedAmount was never incremented.
  let processed = false;
  try {
    processed = await this.prisma.$transaction(async (tx) => {
      // Idempotency guard: only one concurrent request can flip PENDING → SUCCESS
      const updated = await tx.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          razorpayPaymentId,
          status: PaymentStatus.SUCCESS,
          rawResponse: payload,
        },
      });

      // Concurrent webhook already won the race — skip silently
      if (updated.count === 0) return false;

      await tx.donation.update({
        where: { id: payment.donationId },
        data: { status: PaymentStatus.SUCCESS },
      });

      await tx.fundraiser.update({
        where: { id: payment.donation.fundraiserId },
        data: { raisedAmount: { increment: payment.donation.donationAmount } },
      });

      return true;
    });
  } catch (err) {
    this.logger.error(
      `[CRITICAL] Payment/donation/fundraiser update failed for payment ${payment.id} — manual reconciliation required`,
      err,
    );
    return;
  }

  // Concurrent retry already handled — skip emails
  if (!processed) return;

  // Fire-and-forget: return 200 to Razorpay immediately; emails/PDF run in background
  this.sendPostPaymentNotifications(payment, razorpayPaymentId).catch((err) =>
    this.logger.error(
      `Unhandled error in post-payment notifications for payment ${payment.id}`,
      err,
    ),
  );
}

private async sendPostPaymentNotifications(
  payment: any,
  razorpayPaymentId: string,
) {
  // 📩 Fundraiser notification (best-effort)
  try {
    await this.mailService.sendDonationReceivedMail(
      payment.donation.fundraiser.creator.email,
      {
        fundraiserName:
          payment.donation.fundraiser.creator.firstName ?? 'User',
        campaignTitle: payment.donation.fundraiser.title,
      },
    );
  } catch (err) {
    this.logger.error(
      `Failed to send donation received email for payment ${payment.id}`,
      err,
    );
  }

  const donorEmail =
    payment.donation.guestEmail ?? payment.donation.donor?.email;

  if (!donorEmail) return;

  const donorName =
    payment.donation.guestName ??
    payment.donation.donor?.firstName ??
    'Supporter';

  // 📩 Donor receipt (best-effort — receipt generation + email in one block)
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
  } catch (err) {
    this.logger.error(
      `Failed to send donor receipt email for payment ${payment.id}`,
      err,
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
