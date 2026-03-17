import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

import { WebhooksService } from './webhooks.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { ReceiptService } from 'src/receipt/receipt.service';
import { PaymentStatus } from '@prisma/client';

// ── Test helpers ─────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = 'test-webhook-secret-32-chars-xxxx';

/** Generate a valid HMAC-SHA256 signature for the given raw body. */
function sign(rawBody: Buffer): string {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
}

/** Build a payment.captured webhook payload. */
function capturedPayload(orderId: string, paymentId: string) {
  return {
    event: 'payment.captured',
    payload: { payment: { entity: { id: paymentId, order_id: orderId } } },
  };
}

/** Build a payment.failed webhook payload. */
function failedPayload(orderId: string) {
  return {
    event: 'payment.failed',
    payload: { payment: { entity: { id: 'pay_fail', order_id: orderId } } },
  };
}

/** Encode a payload to a raw body Buffer (mirrors what Express does). */
function encode(payload: object): Buffer {
  return Buffer.from(JSON.stringify(payload));
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_DONATION_AMOUNT = { toNumber: () => 500 };

const MOCK_PAYMENT = {
  id: 'payment-uuid',
  donationId: 'donation-uuid',
  status: PaymentStatus.PENDING,
  createdAt: new Date('2024-06-01T10:00:00Z'),
  donation: {
    donationAmount: MOCK_DONATION_AMOUNT,
    fundraiserId: 'fundraiser-uuid',
    guestEmail: null,
    guestName: null,
    donor: { email: 'donor@example.com', firstName: 'Alice' },
    fundraiser: {
      id: 'fundraiser-uuid',
      title: 'Help Alice Train',
      creator: { firstName: 'Bob', email: 'bob@example.com' },
    },
  },
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prisma: Record<string, any>;
  let mailService: Record<string, any>;
  let receiptService: Record<string, any>;

  beforeEach(async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

    // Minimal Prisma mock — only the methods the service actually calls
    prisma = {
      payment: {
        findUnique: jest.fn(),
        update:     jest.fn().mockResolvedValue({}),
        updateMany: jest.fn(),
      },
      donation:   { update: jest.fn().mockResolvedValue({}) },
      fundraiser: { update: jest.fn().mockResolvedValue({}) },
      // Default: resolve the callback/array form transparently
      $transaction: jest.fn().mockImplementation(async (fnOrArray: any) => {
        if (typeof fnOrArray === 'function') return fnOrArray(prisma);
        return Promise.all(fnOrArray.map((p: any) => Promise.resolve(p)));
      }),
    };

    mailService = {
      sendDonationReceivedMail: jest.fn().mockResolvedValue(undefined),
      sendDonorThankYouMail:    jest.fn().mockResolvedValue(undefined),
    };

    receiptService = {
      generateDonationReceipt: jest.fn().mockResolvedValue(Buffer.from('%PDF')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService,  useValue: prisma },
        { provide: MailService,    useValue: mailService },
        { provide: ReceiptService, useValue: receiptService },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  afterEach(() => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    jest.clearAllMocks();
  });

  // ── Signature verification ─────────────────────────────────────────────────

  describe('HMAC signature verification', () => {
    it('rejects an invalid signature with BadRequestException', async () => {
      const payload = capturedPayload('ord_x', 'pay_x');
      const body = encode(payload);

      await expect(
        service.handleRazorpayEvent(payload, body, 'wrong-signature'),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts a correctly signed request', async () => {
      const payload = failedPayload('ord_nosuchorder');
      const body    = encode(payload);

      // payment not found → handler exits early, no DB writes
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.handleRazorpayEvent(payload, body, sign(body)),
      ).resolves.not.toThrow();
    });

    it('rejects when the body is tampered after signing', async () => {
      const originalBody = encode(capturedPayload('ord_t', 'pay_t'));
      const goodSig      = sign(originalBody);
      const tamperedBody = Buffer.from(originalBody.toString().replace('pay_t', 'pay_hacked'));

      await expect(
        service.handleRazorpayEvent(JSON.parse(tamperedBody.toString()), tamperedBody, goodSig),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── payment.captured ──────────────────────────────────────────────────────

  describe('payment.captured', () => {
    it('executes payment + donation + fundraiser updates in a single transaction', async () => {
      const payload = capturedPayload('ord_1', 'pay_1');
      const body    = encode(payload);

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(MOCK_PAYMENT);
      (prisma.payment.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.handleRazorpayEvent(payload, body, sign(body));

      // The service must wrap all three writes in a single $transaction call
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      // Payment status → SUCCESS, razorpayPaymentId recorded
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MOCK_PAYMENT.id, status: PaymentStatus.PENDING },
          data: expect.objectContaining({
            status: PaymentStatus.SUCCESS,
            razorpayPaymentId: 'pay_1',
          }),
        }),
      );

      // Donation status → SUCCESS
      expect(prisma.donation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MOCK_PAYMENT.donationId },
          data: { status: PaymentStatus.SUCCESS },
        }),
      );

      // raisedAmount incremented by the donation amount
      expect(prisma.fundraiser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MOCK_PAYMENT.donation.fundraiserId },
          data: { raisedAmount: { increment: MOCK_DONATION_AMOUNT } },
        }),
      );
    });

    it('does not process if payment is already SUCCESS (idempotency guard)', async () => {
      const payload = capturedPayload('ord_done', 'pay_done');
      const body    = encode(payload);

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        ...MOCK_PAYMENT,
        status: PaymentStatus.SUCCESS,
      });

      await service.handleRazorpayEvent(payload, body, sign(body));

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('does not process if payment record is not found (unknown order)', async () => {
      const payload = capturedPayload('ord_ghost', 'pay_ghost');
      const body    = encode(payload);

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      await service.handleRazorpayEvent(payload, body, sign(body));

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('skips notifications when a concurrent webhook wins the race (updateMany count=0)', async () => {
      const payload = capturedPayload('ord_race', 'pay_race');
      const body    = encode(payload);

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(MOCK_PAYMENT);
      // Simulate another request already flipped the status
      (prisma.payment.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      await service.handleRazorpayEvent(payload, body, sign(body));

      // Notifications are fire-and-forget; waiting one microtask tick is enough
      await new Promise(setImmediate);
      expect(mailService.sendDonationReceivedMail).not.toHaveBeenCalled();
    });

    it('sends fundraiser notification and donor receipt after successful capture', async () => {
      const payload = capturedPayload('ord_notify', 'pay_notify');
      const body    = encode(payload);

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(MOCK_PAYMENT);
      (prisma.payment.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.handleRazorpayEvent(payload, body, sign(body));

      // Notifications are fire-and-forget; flush the micro-task queue
      await new Promise(setImmediate);

      expect(mailService.sendDonationReceivedMail).toHaveBeenCalledWith(
        MOCK_PAYMENT.donation.fundraiser.creator.email,
        expect.objectContaining({ campaignTitle: MOCK_PAYMENT.donation.fundraiser.title }),
      );
      expect(receiptService.generateDonationReceipt).toHaveBeenCalled();
      expect(mailService.sendDonorThankYouMail).toHaveBeenCalledWith(
        MOCK_PAYMENT.donation.donor.email,
        expect.objectContaining({ campaignTitle: MOCK_PAYMENT.donation.fundraiser.title }),
      );
    });

    it('does not send donor receipt when no donor email is available', async () => {
      const payload = capturedPayload('ord_noemail', 'pay_noemail');
      const body    = encode(payload);

      const paymentWithNoDonorEmail = {
        ...MOCK_PAYMENT,
        donation: {
          ...MOCK_PAYMENT.donation,
          guestEmail: null,
          donor: null, // guest donor with no email
        },
      };

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(paymentWithNoDonorEmail);
      (prisma.payment.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.handleRazorpayEvent(payload, body, sign(body));
      await new Promise(setImmediate);

      expect(mailService.sendDonorThankYouMail).not.toHaveBeenCalled();
    });
  });

  // ── payment.failed ────────────────────────────────────────────────────────

  describe('payment.failed', () => {
    it('marks payment and donation as FAILED', async () => {
      const payload = failedPayload('ord_fail_1');
      const body    = encode(payload);

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        id: 'payment-uuid',
        donationId: 'donation-uuid',
        status: PaymentStatus.PENDING,
      });

      await service.handleRazorpayEvent(payload, body, sign(body));

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('does not update if payment is already FAILED (idempotency)', async () => {
      const payload = failedPayload('ord_already_failed');
      const body    = encode(payload);

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        id: 'payment-uuid',
        donationId: 'donation-uuid',
        status: PaymentStatus.FAILED,
      });

      await service.handleRazorpayEvent(payload, body, sign(body));

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('does not update if payment record is not found', async () => {
      const payload = failedPayload('ord_not_found');
      const body    = encode(payload);

      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);

      await service.handleRazorpayEvent(payload, body, sign(body));

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ── Unknown events ────────────────────────────────────────────────────────

  describe('unknown event type', () => {
    it('resolves without error for unrecognised events', async () => {
      const payload = { event: 'order.paid' };
      const body    = encode(payload);

      await expect(
        service.handleRazorpayEvent(payload, body, sign(body)),
      ).resolves.not.toThrow();

      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });
  });
});
