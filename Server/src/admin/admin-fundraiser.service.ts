import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CampaignStatus, Prisma, UserRole } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AdminFundraiserService {

  private readonly logger = new Logger(AdminFundraiserService.name);

  constructor(private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) { }

  async listCampaigns(status: CampaignStatus) {
    if (!Object.values(CampaignStatus).includes(status)) {
      throw new BadRequestException('Invalid campaign status');
    }

    const campaigns = await this.prisma.fundraiser.findMany({
      where: { status },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        campaignFor: true,
        goalAmount: true,
        raisedAmount: true,
        status: true,
        city: true,
        state: true,
        country: true,
        coverImageURL: true,
        createdAt: true,
        updatedAt: true,

        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Campaigns fetched successfully',
      data: {
        count: campaigns.length,
        campaigns,
      },
    };
  }

  async getAllCampaigns(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [campaigns, total] = await this.prisma.$transaction([
      this.prisma.fundraiser.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          goalAmount: true,
          raisedAmount: true,
          createdAt: true,
          creator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.fundraiser.count(),
    ]);

    return {
      success: true,
      data: campaigns,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }


  async getCampaignsByCreatorId(creatorId: string) {
    const campaigns = await this.prisma.fundraiser.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        coverImageURL: true,
        goalAmount: true,
        raisedAmount: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      count: campaigns.length,
      data: campaigns,
    };
  }


  async getCampaignById(id: string) {
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            profileImageUrl: true,
            email: true,
            role: true,
            createdAt: true,
            panDetails: true,
          },
        },

        beneficiaryUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            provider: true,
            googleId: true,
            role: true,
            isEmailVerified: true,
            profileImageUrl: true,
            createdAt: true,
            updatedAt: true,
          }
        },

        // OTHER campaign
        beneficiaryOther: true,

        media: true,// images / videos
        recipientAccount: true,
        fundraiserupdates: true,
        documents: true,
        donations: {
          where: {
            status: 'SUCCESS',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            donationAmount: true,
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
        },
        _count: {
          select: {
            donations: {
              where: { status: 'SUCCESS' },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    //  Handle anonymous donors
    const donations = campaign.donations.map((donation) => {

      if (!donation.donor) {
        return {
          id: donation.id,
          donationAmount: donation.donationAmount,
          createdAt: donation.createdAt,
          donor: donation.isAnonymous
            ? {
              id: null,
              firstName: 'Anonymous',
              lastName: 'Donor',
            }
            : {
              id: null,
              firstName: donation.guestName ?? 'Guest',
              lastName: '',
            },
        };
      }
      //register anonymous donor
      if (donation.isAnonymous) {
        return {
          ...donation,
          donor: {
            id: null,
            firstName: 'Anonymous',
            lastName: 'Donor',
          },
        };
      }

      return donation;
    });

    return {
      success: true,
      message: 'Campaign fetched successfully',
      totalDonations: campaign._count.donations,
      data: {
        ...campaign,
        donations,
      },
    };
  }

  async approveCampaign(id: string) {
    // Fetch campaign (keep as-is)
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,

        //ADD THESE (needed for email)
        title: true,
        creator: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Campaign cannot be approved from status ${campaign.status}`,
      );
    }

    //  Update campaign (keep as-is)
    const updated = await this.prisma.fundraiser.update({
      where: { id },
      data: {
        status: CampaignStatus.APPROVED,
        approvedAt: new Date(),

        // safety cleanup
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    // Send approval email (NEW)
    try {
      await this.mailService.sendFundraiserApprovedMail(
        campaign.creator.email,
        {
          name: campaign.creator.firstName ?? 'User',
          title: campaign.title,
        },
      );
    } catch (error) {
      this.logger.error('Fundraiser approval mail failed', error);
    }

    // Return response (keep as-is)
    return {
      success: true,
      message: 'Campaign approved successfully',
      data: {
        id: updated.id,
        status: updated.status,
        approvedAt: updated.approvedAt,
      },
    };
  }


  async rejectCampaign(
    id: string,
    rejectionReason: string,
  ) {
    if (!rejectionReason?.trim()) {
      throw new BadRequestException(
        'Rejection reason is required',
      );
    }

    // Fetch campaign (extended only for email)
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,

        //  required for rejection email
        title: true,
        creator: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Campaign cannot be rejected from status ${campaign.status}`,
      );
    }

    //  Update campaign (unchanged)
    const updated = await this.prisma.fundraiser.update({
      where: { id },
      data: {
        status: CampaignStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason,

        // safety cleanup
        approvedAt: null,
      },
    });

    //  Send rejection email (added safely)
    try {
      await this.mailService.sendFundraiserRejectedMail(
        campaign.creator.email,
        {
          name: campaign.creator.firstName ?? 'User',
          title: campaign.title,
          reason: rejectionReason,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send rejection email for campaign ${campaign.id}`,
        error,
      );
    }

    //  Response (unchanged)
    return {
      success: true,
      message: 'Campaign rejected.',
      data: {
        id: updated.id,
        status: updated.status,
        rejectedAt: updated.rejectedAt,
        rejectionReason: updated.rejectionReason,
      },
    };
  }


  async activateCampaign(id: string) {
    //  Fetch campaign (extended only for email)
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        approvedAt: true,

        //  required for activation email
        title: true,
        creator: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.APPROVED) {
      throw new BadRequestException(
        `Campaign can be activated only from APPROVED status`,
      );
    }

    //  Activate campaign (unchanged)
    const updated = await this.prisma.fundraiser.update({
      where: { id },
      data: {
        status: CampaignStatus.ACTIVE,
        // optional: activatedAt if you add it later
      },
    });

    //  Send activation email (added safely)
    try {
      await this.mailService.sendFundraiserActivatedMail(
        campaign.creator.email,
        {
          name: campaign.creator.firstName ?? 'User',
          title: campaign.title,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send activation email for campaign ${campaign.id}`,
        error,
      );
    }

    //  Response (unchanged)
    return {
      success: true,
      message: 'Campaign activated successfully. It’s now live.',
      data: {
        id: updated.id,
        status: updated.status,
      },
    };
  }

  async reActivateCampaign(id: string) {
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        approvedAt: true,

        //  required for activation email
        title: true,
        creator: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.SUSPENDED) {
      throw new BadRequestException(
        `Campaign can be activated only from SUSPENDED status`,
      );
    }

    //  Activate campaign (unchanged)
    const updated = await this.prisma.fundraiser.update({
      where: { id },
      data: {
        status: CampaignStatus.ACTIVE,
        // optional: activatedAt if you add it later
      },
    });

    //  Send activation email (added safely)
    try {
      await this.mailService.sendFundraiserActivatedMail(
        campaign.creator.email,
        {
          name: campaign.creator.firstName ?? 'User',
          title: campaign.title,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send activation email for campaign ${campaign.id}`,
        error,
      );
    }

    //  Response (unchanged)
    return {
      success: true,
      message: 'Campaign activated successfully. It’s now live.',
      data: {
        id: updated.id,
        status: updated.status,
      },
    };
  }

  async suspendCampaign(id: string) {
    //  Fetch campaign (extended only for email)
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,

        //  required for suspension email
        title: true,
        creator: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException(
        `Campaign can be suspended only from ACTIVE status`,
      );
    }

    //  Suspend campaign (unchanged)
    const updated = await this.prisma.fundraiser.update({
      where: { id },
      data: {
        status: CampaignStatus.SUSPENDED,
      },
    });

    //  Send suspension email (added safely)
    try {
      await this.mailService.sendFundraiserSuspendedMail(
        campaign.creator.email,
        {
          name: campaign.creator.firstName ?? 'User',
          title: campaign.title,
          reason: 'Your campaign has been temporarily suspended by admin.',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to send suspension email for campaign ${campaign.id}`,
        error,
      );
    }

    //  Response (unchanged)
    return {
      success: true,
      message: 'Campaign suspended successfully. It’s no longer visible to donors.',
      data: {
        id: updated.id,
        status: updated.status,
      },
    };
  }

  async completeCampaign(id: string) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        goalAmount: true,
        raisedAmount: true,

        title: true,
        creator: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!fundraiser) throw new NotFoundException('Campaign not found');

    if (fundraiser.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException(
        `Campaign can be completed only from ACTIVE status. Current: ${fundraiser.status}`,
      );
    }

    const goal = new Prisma.Decimal(fundraiser.goalAmount);
    const raised = new Prisma.Decimal(fundraiser.raisedAmount);

    if (raised.lessThan(goal)) {
      throw new BadRequestException(
        `Goal not reached yet. Raised ${raised.toFixed(2)} / Goal ${goal.toFixed(2)}`,
      );
    }

    // Atomic conditional update: only completes if still ACTIVE (prevents race condition)
    const result = await this.prisma.fundraiser.updateMany({
      where: { id, status: CampaignStatus.ACTIVE },
      data: { status: CampaignStatus.COMPLETED },
    });

    if (result.count === 0) {
      throw new BadRequestException(
        'Campaign is no longer in ACTIVE status. It may have been completed by another request.',
      );
    }

    const updated = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: { id: true, status: true, goalAmount: true, raisedAmount: true },
    });

    const creatorEmail = fundraiser.creator?.email;
    const adminEmails = (process.env.ADMIN_EMAIL ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    try {
      // Send to fundraiser owner
      if (creatorEmail) {
        await this.mailService.sendFundraiserCompletedMail(creatorEmail, {
          name: fundraiser.creator.firstName ?? 'User',
          title: fundraiser.title,
          goalAmount: goal.toFixed(2),
          raisedAmount: raised.toFixed(2),
        });
      }

      // Send to admin(s)
      if (adminEmails.length) {
        await this.mailService.sendFundraiserCompletedAdminMail(adminEmails, {
          fundraiserId: fundraiser.id,
          title: fundraiser.title,
          creatorEmail: creatorEmail ?? 'N/A',
          creatorName: fundraiser.creator.firstName ?? 'N/A',
          goalAmount: goal.toFixed(2),
          raisedAmount: raised.toFixed(2),
        });
      }
    } catch (err) {
      this.logger?.error?.('Fundraiser completed mail failed', err);
    }

    return {
      success: true,
      message: 'Campaign completed successfully',
      data: {
        id: updated!.id,
        status: updated!.status,
        goalAmount: new Prisma.Decimal(updated!.goalAmount).toFixed(2),
        raisedAmount: new Prisma.Decimal(updated!.raisedAmount).toFixed(2),
      },
    };
  }


  // List recipient / bank accounts
  async listRecipientAccounts(onlyUnverified: boolean) {
    const accounts = await this.prisma.recipientAccount.findMany({
      where: onlyUnverified ? { isVerified: false } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        recipientType: true,
        bankName: true,
        accountNumber: true,
        ifscCode: true,
        country: true,
        isVerified: true,
        createdAt: true,
        fundraiser: {
          select: {
            id: true,
            title: true,
            status: true,
            creator: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    return {
      success: true,
      count: accounts.length,
      data: accounts,
    };
  }

  // recipient-account Verification
  async verifyRecipientAccount(id: string) {
    const account = await this.prisma.recipientAccount.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Recipient account not found');
    }

    if (account.isVerified) {
      return {
        id: account.id,
        isVerified: true,
      };
    }

    const updated = await this.prisma.recipientAccount.update({
      where: { id },
      data: {
        isVerified: true,
      },
    });

    return {
      message: 'Recipient account verified successfully.',
      id: updated.id,
      isVerified: updated.isVerified,
    };
  }

  async getAllPlatformTips() {
    const donations = await this.prisma.donation.findMany({
      where: {
        platformTipAmount: { gt: 0 },
        status: 'SUCCESS',
      },
      select: {
        id: true,
        platformTipAmount: true,
        isAnonymous: true,
        createdAt: true,

        guestName: true,
        guestEmail: true,

        donor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const data = donations.map((donation) => {
      const isGuest = !donation.donor;

      return {
        donationId: donation.id,
        platformTipAmount: donation.platformTipAmount.toString(),

        donorName: isGuest
          ? donation.guestName ?? 'Guest'
          : `${donation.donor!.firstName} ${donation.donor!.lastName}`,

        donorEmail: isGuest
          ? donation.guestEmail
          : donation.donor!.email,

        isGuest,
        isAnonymous: donation.isAnonymous,
        createdAt: donation.createdAt,
      };
    });

    return {
      success: true,
      count: data.length,
      data,
    };
  }

  //GetallDonor
  async getAllDonor() {
    const donations = await this.prisma.donation.findMany({
      where: {
        status: 'SUCCESS',
      },
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
    });

    return donations.map(d => {
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

      // Anonymous donation (HIGHEST PRIORITY)
      if (d.isAnonymous) {
        return {
          ...base,
          donorName: 'Anonymous',
        };
      }

      // Registered donor
      if (d.donorId && d.donor) {
        return {
          ...base,
          donor: d.donor,
        };
      }

      // Guest donor
      return {
        ...base,
        guestName: d.guestName,
        guestEmail: d.guestEmail,
        guestMobile: d.guestMobile,
      };
    });
  }

  //Get all User
  async getAllUser() {
    return await this.prisma.user.findMany({
      where: {
        role: {
          not: UserRole.ADMIN,
        },
      },
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
    });
  }

  //GetAllUserBYId
  async getByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
        role: {
          not: UserRole.ADMIN,
        }
      },
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
          where: {
            status: 'SUCCESS',
          },
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
    return user;
  }

  async getAllReview (){
    return await this.prisma.review.findMany();
  }

  async reviewApprove(id: string) {
    const res = await this.prisma.review.updateMany({
      where: {
        id,
        isVerified: false, 
      },
      data: {
        isVerified: true,
      },
    });

    if (res.count === 0) {
      throw new BadRequestException('Review not found or already approved');
    }

    return {
      message: 'Approved Review',
    };
  }

  async reviewdelete(id: string) {
    const res = await this.prisma.review.deleteMany({
      where: { id },
    });

    if (res.count === 0) {
      throw new BadRequestException('Review not found');
    }

    return { message: 'Review Deleted' };
  }
}

