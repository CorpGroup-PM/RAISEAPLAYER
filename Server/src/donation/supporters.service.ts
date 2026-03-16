import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SupportersService {
  constructor(private readonly prisma: PrismaService) {}

  async getSupporters(fundraiserId: string) {

    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
      select: { id: true },
    });

    if (!fundraiser) {
      throw new BadRequestException('Fundraiser not found');
    }

    // Single query — donor relation resolved via batched IN lookup (no N+1)
    const donations = await this.prisma.donation.findMany({
      where: {
        fundraiserId,
        status: PaymentStatus.SUCCESS,
      },
      select: {
        id: true,
        donationAmount: true,
        currency: true,
        createdAt: true,
        isAnonymous: true,
        guestName: true,
        donor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const supporters = donations.map((donation) => {

      //  Guest donor
      if (!donation.donor) {
        return {
          id: donation.id,
          donationAmount: donation.donationAmount,
          currency: donation.currency,
          donatedAt: donation.createdAt,
          donor: donation.isAnonymous
            ? { id: null, firstName: 'Anonymous', lastName: 'Donor' }
            : { id: null, firstName: donation.guestName ?? 'Guest', lastName: '' },
        };
      }

      //  Registered anonymous donor
      if (donation.isAnonymous) {
        return {
          id: donation.id,
          donationAmount: donation.donationAmount,
          currency: donation.currency,
          donatedAt: donation.createdAt,
          donor: { id: null, firstName: 'Anonymous', lastName: 'Donor' },
        };
      }

      //  Registered visible donor
      return {
        id: donation.id,
        donationAmount: donation.donationAmount,
        currency: donation.currency,
        donatedAt: donation.createdAt,
        donor: {
          id: donation.donor.id,
          firstName: donation.donor.firstName,
          lastName: donation.donor.lastName ?? '',
        },
      };
    });

    return { supporters };
  }
}
