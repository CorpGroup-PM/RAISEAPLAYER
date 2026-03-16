import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CampaignStatus, Prisma } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';
import { CryptoHelper } from 'src/common/helpers/crypto.helper';

/**
 * Handles admin operations scoped to campaigns (fundraisers):
 * list, view, approve, reject, activate, re-activate, suspend, complete.
 *
 * User management  → AdminUserService
 * Review management → AdminReviewService
 * Bank-account mgmt → AdminBankAccountService
 */
@Injectable()
export class AdminCampaignService {

  private readonly logger = new Logger(AdminCampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /** Write a best-effort audit log entry. Never throws. */
  private async audit(
    adminId: string,
    action: string,
    targetId: string,
    targetTable: string,
    details?: Prisma.InputJsonObject,
  ): Promise<void> {
    try {
      await this.prisma.adminLog.create({
        data: { adminId, action, targetId, targetTable, details: details ?? {} },
      });
    } catch (err) {
      this.logger.error(
        `[AUDIT] Failed to write audit log: ${action} on ${targetTable}:${targetId}`,
        err,
      );
    }
  }

  /** Decrypt PAN — admin sees full plaintext for KYC validation. */
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

  // ── Listing ───────────────────────────────────────────────────────────────

  async listCampaigns(status: CampaignStatus) {
    if (!Object.values(CampaignStatus).includes(status)) {
      throw new BadRequestException('Invalid campaign status');
    }

    const campaigns = await this.prisma.fundraiser.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
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
      data: { count: campaigns.length, campaigns },
    };
  }

  /** Returns a single-query count per status: { ACTIVE: 3, APPROVED: 1, ... } */
  async getStatusCounts(): Promise<{ success: boolean; data: Record<string, number> }> {
    const rows = await this.prisma.fundraiser.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const data: Record<string, number> = {};
    for (const row of rows) {
      data[row.status] = row._count.status;
    }
    return { success: true, data };
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

    return { success: true, count: campaigns.length, data: campaigns };
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
          },
        },
        beneficiaryOther: true,
        media: true,
        recipientAccount: true,
        fundraiserupdates: true,
        documents: true,
        donations: {
          where: { status: 'SUCCESS' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            donationAmount: true,
            createdAt: true,
            isAnonymous: true,
            guestName: true,
            donor: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { donations: { where: { status: 'SUCCESS' } } } },
      },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    const donations = campaign.donations.map((donation) => {
      if (!donation.donor) {
        return {
          id: donation.id,
          donationAmount: donation.donationAmount,
          createdAt: donation.createdAt,
          donor: donation.isAnonymous
            ? { id: null, firstName: 'Anonymous', lastName: 'Donor' }
            : { id: null, firstName: donation.guestName ?? 'Guest', lastName: '' },
        };
      }
      if (donation.isAnonymous) {
        return {
          ...donation,
          donor: { id: null, firstName: 'Anonymous', lastName: 'Donor' },
        };
      }
      return donation;
    });

    // Decrypt account number for admin — full plaintext
    let decryptedRecipientAccount = campaign.recipientAccount;
    if (campaign.recipientAccount?.accountNumber) {
      let decrypted = '(unreadable)';
      try {
        decrypted = CryptoHelper.decryptField(campaign.recipientAccount.accountNumber);
      } catch { /* keep fallback */ }
      decryptedRecipientAccount = { ...campaign.recipientAccount, accountNumber: decrypted };
    }

    return {
      success: true,
      message: 'Campaign fetched successfully',
      totalDonations: campaign._count.donations,
      data: {
        ...campaign,
        creator: {
          ...campaign.creator,
          panDetails: this.maskPan(campaign.creator?.panDetails),
        },
        donations,
        recipientAccount: decryptedRecipientAccount,
      },
    };
  }

  // ── Status transitions ────────────────────────────────────────────────────

  async approveCampaign(id: string, adminId: string) {
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        title: true,
        creator: { select: { email: true, firstName: true } },
      },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    if (campaign.status !== CampaignStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Campaign cannot be approved from status ${campaign.status}`,
      );
    }

    const updated = await this.prisma.fundraiser.update({
      where: { id },
      data: {
        status: CampaignStatus.APPROVED,
        approvedAt: new Date(),
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    await this.audit(adminId, 'CAMPAIGN_APPROVED', id, 'Fundraiser', {
      previousStatus: campaign.status,
      newStatus: CampaignStatus.APPROVED,
    });

    try {
      await this.mailService.sendFundraiserApprovedMail(campaign.creator.email, {
        name: campaign.creator.firstName ?? 'User',
        title: campaign.title,
      });
    } catch (error) {
      this.logger.error('Fundraiser approval mail failed', error);
    }

    return {
      success: true,
      message: 'Campaign approved successfully',
      data: { id: updated.id, status: updated.status, approvedAt: updated.approvedAt },
    };
  }

  async rejectCampaign(id: string, rejectionReason: string, adminId: string) {
    if (!rejectionReason?.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }

    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        title: true,
        creator: { select: { email: true, firstName: true } },
      },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    if (campaign.status !== CampaignStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Campaign cannot be rejected from status ${campaign.status}`,
      );
    }

    const updated = await this.prisma.fundraiser.update({
      where: { id },
      data: {
        status: CampaignStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason,
        approvedAt: null,
      },
    });

    await this.audit(adminId, 'CAMPAIGN_REJECTED', id, 'Fundraiser', {
      previousStatus: campaign.status,
      newStatus: CampaignStatus.REJECTED,
      rejectionReason,
    });

    try {
      await this.mailService.sendFundraiserRejectedMail(campaign.creator.email, {
        name: campaign.creator.firstName ?? 'User',
        title: campaign.title,
        reason: rejectionReason,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send rejection email for campaign ${campaign.id}`,
        error,
      );
    }

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

  async activateCampaign(id: string, adminId: string) {
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        approvedAt: true,
        title: true,
        creator: { select: { email: true, firstName: true } },
      },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    if (campaign.status !== CampaignStatus.APPROVED) {
      throw new BadRequestException(
        `Campaign can be activated only from APPROVED status`,
      );
    }

    const updated = await this.prisma.fundraiser.update({
      where: { id },
      data: { status: CampaignStatus.ACTIVE },
    });

    await this.audit(adminId, 'CAMPAIGN_ACTIVATED', id, 'Fundraiser', {
      previousStatus: campaign.status,
      newStatus: CampaignStatus.ACTIVE,
    });

    try {
      await this.mailService.sendFundraiserActivatedMail(campaign.creator.email, {
        name: campaign.creator.firstName ?? 'User',
        title: campaign.title,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send activation email for campaign ${campaign.id}`,
        error,
      );
    }

    return {
      success: true,
      message: "Campaign activated successfully. It's now live.",
      data: { id: updated.id, status: updated.status },
    };
  }

  async reActivateCampaign(id: string, adminId: string) {
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        approvedAt: true,
        title: true,
        creator: { select: { email: true, firstName: true } },
      },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    if (campaign.status !== CampaignStatus.SUSPENDED) {
      throw new BadRequestException(
        `Campaign can be activated only from SUSPENDED status`,
      );
    }

    const updated = await this.prisma.fundraiser.update({
      where: { id },
      data: { status: CampaignStatus.ACTIVE },
    });

    await this.audit(adminId, 'CAMPAIGN_REACTIVATED', id, 'Fundraiser', {
      previousStatus: campaign.status,
      newStatus: CampaignStatus.ACTIVE,
    });

    try {
      await this.mailService.sendFundraiserActivatedMail(campaign.creator.email, {
        name: campaign.creator.firstName ?? 'User',
        title: campaign.title,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send activation email for campaign ${campaign.id}`,
        error,
      );
    }

    return {
      success: true,
      message: "Campaign activated successfully. It's now live.",
      data: { id: updated.id, status: updated.status },
    };
  }

  async suspendCampaign(id: string, adminId: string) {
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        title: true,
        creator: { select: { email: true, firstName: true } },
      },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException(
        `Campaign can be suspended only from ACTIVE status`,
      );
    }

    const updated = await this.prisma.fundraiser.update({
      where: { id },
      data: { status: CampaignStatus.SUSPENDED },
    });

    await this.audit(adminId, 'CAMPAIGN_SUSPENDED', id, 'Fundraiser', {
      previousStatus: campaign.status,
      newStatus: CampaignStatus.SUSPENDED,
    });

    try {
      await this.mailService.sendFundraiserSuspendedMail(campaign.creator.email, {
        name: campaign.creator.firstName ?? 'User',
        title: campaign.title,
        reason: 'Your campaign has been temporarily suspended by admin.',
      });
    } catch (error) {
      this.logger.error(
        `Failed to send suspension email for campaign ${campaign.id}`,
        error,
      );
    }

    return {
      success: true,
      message: "Campaign suspended successfully. It's no longer visible to donors.",
      data: { id: updated.id, status: updated.status },
    };
  }

  async completeCampaign(id: string, adminId: string) {
    const fundraiser = await this.prisma.fundraiser.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        goalAmount: true,
        raisedAmount: true,
        title: true,
        creator: { select: { email: true, firstName: true } },
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

    // Atomic conditional update prevents race condition
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

    await this.audit(adminId, 'CAMPAIGN_COMPLETED', id, 'Fundraiser', {
      previousStatus: CampaignStatus.ACTIVE,
      newStatus: CampaignStatus.COMPLETED,
      goalAmount: goal.toFixed(2),
      raisedAmount: raised.toFixed(2),
    });

    const creatorEmail = fundraiser.creator?.email;
    const adminEmails = (process.env.ADMIN_EMAIL ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    try {
      if (creatorEmail) {
        await this.mailService.sendFundraiserCompletedMail(creatorEmail, {
          name: fundraiser.creator.firstName ?? 'User',
          title: fundraiser.title,
          goalAmount: goal.toFixed(2),
          raisedAmount: raised.toFixed(2),
        });
      }
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
      this.logger.error('Fundraiser completed mail failed', err);
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
}

/** @deprecated Use AdminCampaignService */
export { AdminCampaignService as AdminFundraiserService };
