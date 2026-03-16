import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { CryptoHelper } from 'src/common/helpers/crypto.helper';

/**
 * Handles admin operations scoped to users and donors:
 * list users, view user detail, list donors, list platform tips.
 */
@Injectable()
export class AdminUserService {

  constructor(private readonly prisma: PrismaService) {}

  /** Decrypt PAN and return full plaintext for admin KYC validation. */
  private maskPan(
    pan: Record<string, any> | null | undefined,
  ): Record<string, any> | null | undefined {
    if (!pan?.panNumber) return pan;
    try {
      const plain = CryptoHelper.decryptField(pan.panNumber);
      return { ...pan, panNumber: plain };
    } catch {
      return { ...pan, panNumber: '(unreadable)' };
    }
  }

  async getAllUser(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = { role: { not: UserRole.ADMIN } };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: users,
    };
  }

  async getByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, role: { not: UserRole.ADMIN } },
      select: {
        id: true,
        profileImageUrl: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
        panDetails: true,
        createdAt: true,
        fundraisersCreated: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            goalAmount: true,
            raisedAmount: true,
            createdAt: true,
          },
        },
        donations: {
          where: { status: 'SUCCESS' },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fundraiserId: true,
            donationAmount: true,
            platformTipAmount: true,
            totalAmount: true,
            currency: true,
            status: true,
            createdAt: true,
            fundraiser: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!user) throw new BadRequestException('User not found');

    return {
      ...user,
      panDetails: this.maskPan(user.panDetails),
    };
  }

  async getAllDonor(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

    const [donations, total] = await this.prisma.$transaction([
      this.prisma.donation.findMany({
        where,
        include: {
          donor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.donation.count({ where }),
    ]);

    const data = donations.map((d) => {
      const base = {
        id: d.id,
        fundraiserId: d.fundraiserId,
        donorId: d.donorId,
        donationAmount: d.donationAmount,
        platformTipAmount: d.platformTipAmount,
        totalAmount: d.totalAmount,
        currency: d.currency,
        status: d.status,
        isAnonymous: d.isAnonymous,
        createdAt: d.createdAt,
      };

      if (d.isAnonymous) return { ...base, donorName: 'Anonymous' };
      if (d.donorId && d.donor) return { ...base, donor: d.donor };

      return {
        ...base,
        guestName: d.guestName,
        guestEmail: d.guestEmail,
        guestMobile: d.guestMobile,
      };
    });

    return {
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async getAllPlatformTips(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [donations, total] = await Promise.all([
      this.prisma.donation.findMany({
        where: { platformTipAmount: { gt: 0 }, status: 'SUCCESS' },
        select: {
          id: true,
          platformTipAmount: true,
          isAnonymous: true,
          createdAt: true,
          guestName: true,
          guestEmail: true,
          donor: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.donation.count({
        where: { platformTipAmount: { gt: 0 }, status: 'SUCCESS' },
      }),
    ]);

    const maskEmail = (email: string | null | undefined): string => {
      if (!email) return '—';
      const [local, domain] = email.split('@');
      return `${local[0]}***@${domain}`;
    };

    const data = donations.map((donation) => {
      const isGuest = !donation.donor;
      const anon = donation.isAnonymous;

      return {
        donationId: donation.id,
        platformTipAmount: donation.platformTipAmount.toString(),
        donorName: anon
          ? 'Anonymous'
          : isGuest
            ? (donation.guestName ?? 'Guest')
            : `${donation.donor!.firstName} ${donation.donor!.lastName}`,
        donorEmail: anon
          ? '—'
          : maskEmail(isGuest ? donation.guestEmail : donation.donor!.email),
        isGuest,
        isAnonymous: anon,
        createdAt: donation.createdAt,
      };
    });

    return {
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }
}
