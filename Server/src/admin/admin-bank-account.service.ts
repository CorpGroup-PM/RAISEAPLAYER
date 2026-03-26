import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CryptoHelper } from 'src/common/helpers/crypto.helper';

/**
 * Handles admin operations scoped to recipient bank accounts:
 * list, verify.
 *
 * verifiedById and verifiedAt are recorded on every verification for full
 * admin accountability (who verified, when).
 */
@Injectable()
export class AdminBankAccountService {

  private readonly logger = new Logger(AdminBankAccountService.name);

  constructor(private readonly prisma: PrismaService) {}

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
        verifiedById: true,
        verifiedAt: true,
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

    // Decrypt account number for admin — admin sees full plaintext
    const data = accounts.map((acc) => {
      let decryptedAccount = '(unreadable)';
      try {
        decryptedAccount = CryptoHelper.decryptField(acc.accountNumber);
      } catch { /* keep fallback */ }
      return { ...acc, accountNumber: decryptedAccount };
    });

    return { success: true, count: data.length, data };
  }

  async verifyPan(campaignId: string, adminId: string) {
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id: campaignId },
      select: { creatorId: true },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    const panDetails = await this.prisma.panDetails.findUnique({
      where: { userId: campaign.creatorId },
      select: { id: true, isPanVerified: true },
    });

    if (!panDetails) throw new NotFoundException('PAN details not found for this campaign creator');

    if (panDetails.isPanVerified) {
      return { id: panDetails.id, isPanVerified: true };
    }

    const updated = await this.prisma.panDetails.update({
      where: { id: panDetails.id },
      data: {
        isPanVerified: true,
        panVerifiedById: adminId,
        panVerifiedAt: new Date(),
      },
    });

    await this.audit(adminId, 'PAN_VERIFIED', panDetails.id, 'PanDetails', {
      campaignId,
      userId: campaign.creatorId,
    });

    return {
      message: 'PAN verified successfully.',
      id: updated.id,
      isPanVerified: updated.isPanVerified,
      panVerifiedById: updated.panVerifiedById,
      panVerifiedAt: updated.panVerifiedAt,
    };
  }

  async verifyAadhaar(campaignId: string, adminId: string) {
    const campaign = await this.prisma.fundraiser.findUnique({
      where: { id: campaignId },
      select: { creatorId: true },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    const aadhaarDetails = await this.prisma.aadhaarDetails.findUnique({
      where: { userId: campaign.creatorId },
      select: { id: true, isAadhaarVerified: true },
    });

    if (!aadhaarDetails) throw new NotFoundException('Aadhaar details not found for this campaign creator');

    if (aadhaarDetails.isAadhaarVerified) {
      return { id: aadhaarDetails.id, isAadhaarVerified: true };
    }

    const updated = await this.prisma.aadhaarDetails.update({
      where: { id: aadhaarDetails.id },
      data: {
        isAadhaarVerified: true,
        aadhaarVerifiedById: adminId,
        aadhaarVerifiedAt: new Date(),
      },
    });

    await this.audit(adminId, 'AADHAAR_VERIFIED', aadhaarDetails.id, 'AadhaarDetails', {
      campaignId,
      userId: campaign.creatorId,
    });

    return {
      message: 'Aadhaar verified successfully.',
      id: updated.id,
      isAadhaarVerified: updated.isAadhaarVerified,
      aadhaarVerifiedById: updated.aadhaarVerifiedById,
      aadhaarVerifiedAt: updated.aadhaarVerifiedAt,
    };
  }

  async verifyRecipientAccount(id: string, adminId: string) {
    const account = await this.prisma.recipientAccount.findUnique({
      where: { id },
    });

    if (!account) throw new NotFoundException('Recipient account not found');

    if (account.isVerified) {
      return {
        id: account.id,
        isVerified: true,
        verifiedById: account.verifiedById,
        verifiedAt: account.verifiedAt,
      };
    }

    const updated = await this.prisma.recipientAccount.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedById: adminId,
        verifiedAt: new Date(),
      },
    });

    await this.audit(adminId, 'BANK_ACCOUNT_VERIFIED', id, 'RecipientAccount', {
      fundraiserId: account.fundraiserId,
    });

    return {
      message: 'Recipient account verified successfully.',
      id: updated.id,
      isVerified: updated.isVerified,
      verifiedById: updated.verifiedById,
      verifiedAt: updated.verifiedAt,
    };
  }
}
