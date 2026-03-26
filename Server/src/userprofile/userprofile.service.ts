import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import path from 'path';
import { UpdateProfileDto } from 'src/userprofile/dto/updateprofile.dto';
import { AwsS3Service } from 'src/aws/aws.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { validateUploadedFile } from 'src/common/upload/validate-uploaded-file';
import { CryptoHelper } from 'src/common/helpers/crypto.helper';

@Injectable()
export class UserprofileService {
  constructor(
    private prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly awsS3Service: AwsS3Service,
  ) {}

  /** Decrypt encrypted panNumber, mask it, and attach signed PDF URL if available. */
  private async buildPanResponse(
    pan: Record<string, any> | null,
  ): Promise<Record<string, any> | null> {
    if (!pan) return null;

    let maskedPan = pan;
    if (pan.panNumber) {
      try {
        const plain = CryptoHelper.decryptField(pan.panNumber);
        maskedPan = { ...pan, panNumber: 'XXXXX' + plain.slice(5) };
      } catch {
        maskedPan = { ...pan, panNumber: 'XXXXXXXXXX' };
      }
    }

    const panPdfSignedUrl = pan.panPdfKey
      ? await this.awsS3Service.getSignedDocumentUrl(pan.panPdfKey).catch(() => null)
      : null;

    return { ...maskedPan, panPdfSignedUrl };
  }

  /** @deprecated Use buildPanResponse for full response. Kept for quick masking inside updateProfile. */
  private maskPan(pan: Record<string, any> | null): Record<string, any> | null {
    if (!pan?.panNumber) return pan;
    try {
      const plain = CryptoHelper.decryptField(pan.panNumber);
      return { ...pan, panNumber: 'XXXXX' + plain.slice(5) };
    } catch {
      return { ...pan, panNumber: 'XXXXXXXXXX' };
    }
  }

  /** Decrypt encrypted aadhaarNumber, mask it, and attach signed image URLs. */
  private async buildAadhaarResponse(
    aadhaar: Record<string, any> | null,
  ): Promise<Record<string, any> | null> {
    if (!aadhaar) return null;

    let maskedNumber: string | null = null;
    if (aadhaar.aadhaarNumber) {
      try {
        const plain = CryptoHelper.decryptField(aadhaar.aadhaarNumber);
        maskedNumber = 'XXXXXXXX' + plain.slice(8);
      } catch {
        maskedNumber = 'XXXXXXXXXXXX';
      }
    }

    const frontPdfSignedUrl = aadhaar.frontPdfKey
      ? await this.awsS3Service.getSignedDocumentUrl(aadhaar.frontPdfKey)
      : null;

    const backPdfSignedUrl = aadhaar.backPdfKey
      ? await this.awsS3Service.getSignedDocumentUrl(aadhaar.backPdfKey)
      : null;

    return {
      id: aadhaar.id,
      userId: aadhaar.userId,
      aadhaarNumber: maskedNumber,
      isAadhaarVerified: aadhaar.isAadhaarVerified,
      frontPdfSignedUrl,
      backPdfSignedUrl,
    };
  }

  // async createPan(userId: string, dto: PanDetailsDto) {

  //     const existing = await this.prisma.panDetails.findUnique({
  //         where: { userId },
  //     });

  //     if (existing) {
  //         throw new BadRequestException('PAN details already exist for this user.');
  //     }

  //     return this.prisma.panDetails.create({
  //         data: {
  //             ...dto,
  //             userId,
  //         },
  //     });
  // }

  async getUserProfilewithPan(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { panDetails: true, aadhaarDetails: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
      panDetails: await this.buildPanResponse(user.panDetails),
      aadhaarDetails: await this.buildAadhaarResponse(user.aadhaarDetails),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { firstName, lastName, phoneNumber, panDetails, aadhaarDetails } = dto;

    //  Checking user exist
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    //  Update user basic profile (all required in dto)
    await this.prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, phoneNumber },
    });

    //  PAN details update and create — encrypt panNumber before persisting
    if (panDetails) {
      // Block editing if PAN is already admin-verified
      const existing = await this.prisma.panDetails.findUnique({
        where: { userId },
        select: { isPanVerified: true },
      });
      if (existing?.isPanVerified) {
        throw new BadRequestException('PAN details have been verified by admin and cannot be edited.');
      }

      const { panNumber, ...restPanDetails } = panDetails;

      // Only encrypt and update panNumber when a real, unmasked value is provided.
      // Skip if empty/null or if it's the masked display value (starts with XXXXX).
      const isRealPan = panNumber && !panNumber.startsWith('XXXXX');
      const panUpdateData: Record<string, any> = { ...restPanDetails };
      if (isRealPan) {
        panUpdateData.panNumber = CryptoHelper.encryptField(panNumber);
      }

      await this.prisma.panDetails.upsert({
        where: { userId },
        create: {
          userId,
          ...restPanDetails,
          panNumber: isRealPan ? CryptoHelper.encryptField(panNumber!) : null,
        },
        update: panUpdateData,
      });
    }

    //  Aadhaar number update (required when aadhaarDetails block is provided)
    if (aadhaarDetails) {
      const existingAadhaar = await this.prisma.aadhaarDetails.findUnique({
        where: { userId },
        select: { isAadhaarVerified: true },
      });
      if (existingAadhaar?.isAadhaarVerified) {
        throw new BadRequestException('Aadhaar details have been verified by admin and cannot be edited.');
      }

      const isRealAadhaar = !aadhaarDetails.aadhaarNumber.startsWith('XXXXXXXX');
      if (isRealAadhaar) {
        await this.prisma.aadhaarDetails.upsert({
          where: { userId },
          create: {
            userId,
            aadhaarNumber: CryptoHelper.encryptField(aadhaarDetails.aadhaarNumber),
          },
          update: {
            aadhaarNumber: CryptoHelper.encryptField(aadhaarDetails.aadhaarNumber),
          },
        });
      }
    }

    //  Fetching and updating data
    const updated = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { panDetails: true, aadhaarDetails: true },
    });

    if (!updated) throw new NotFoundException('User not found');

    return {
      message: 'Profile updated successfully.',
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phoneNumber: updated.phoneNumber,
      panDetails: this.maskPan(updated.panDetails),
      aadhaarDetails: await this.buildAadhaarResponse(updated.aadhaarDetails),
    };
  }

  async updateProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ profilePictureURL: string }> {
    await validateUploadedFile(file, ['image/png', 'image/jpg', 'image/jpeg'], 5);

    try {
      const imageUrl = await this.awsS3Service.uploadProfileImage(file, userId);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          profileImageUrl: imageUrl,
        },
      });
      return { profilePictureURL: imageUrl };
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      throw new InternalServerErrorException(
        'Profile picture upload failed. Please try again later.',
      );
    }
  }

  async getKycStatus(userId: string): Promise<{
    panCompleted: boolean;
    aadhaarCompleted: boolean;
    panNumberMasked?: string;
    kycStatus: 'COMPLETE' | 'INCOMPLETE';
  }> {
    const [pan, aadhaar] = await Promise.all([
      this.prisma.panDetails.findUnique({
        where: { userId },
        select: { panNumber: true },
      }),
      this.prisma.aadhaarDetails.findUnique({
        where: { userId },
        select: { aadhaarNumber: true, frontPdfKey: true, backPdfKey: true },
      }),
    ]);

    const panCompleted = !!pan?.panNumber;
    const aadhaarCompleted = !!(
      aadhaar?.aadhaarNumber &&
      aadhaar.frontPdfKey &&
      aadhaar.backPdfKey
    );

    let panNumberMasked: string | undefined;
    if (panCompleted && pan?.panNumber) {
      try {
        const plain = CryptoHelper.decryptField(pan.panNumber);
        panNumberMasked = 'XXXXX' + plain.slice(5);
      } catch {
        panNumberMasked = 'XXXXXXXXXX';
      }
    }

    return {
      panCompleted,
      aadhaarCompleted,
      kycStatus: panCompleted && aadhaarCompleted ? 'COMPLETE' : 'INCOMPLETE',
      ...(panNumberMasked ? { panNumberMasked } : {}),
    };
  }

  async updateAadhaarPdf(
    userId: string,
    file: Express.Multer.File,
    side: 'front' | 'back',
  ): Promise<{ message: string; signedUrl: string }> {
    const existing = await this.prisma.aadhaarDetails.findUnique({
      where: { userId },
      select: { isAadhaarVerified: true, frontPdfKey: true, backPdfKey: true },
    });

    const oldKey = side === 'front' ? existing?.frontPdfKey : existing?.backPdfKey;

    if (existing?.isAadhaarVerified) {
      throw new BadRequestException('Aadhaar details have been verified by admin and cannot be edited.');
    }

    const key = await this.awsS3Service.uploadKycPdf(file, userId, side);

    // Delete old PDF from S3 if exists
    if (oldKey) {
      await this.awsS3Service.deleteFile(oldKey).catch(() => {/* non-critical */});
    }

    await this.prisma.aadhaarDetails.upsert({
      where: { userId },
      create: {
        userId,
        [side === 'front' ? 'frontPdfKey' : 'backPdfKey']: key,
      },
      update: {
        [side === 'front' ? 'frontPdfKey' : 'backPdfKey']: key,
      },
    });

    const signedUrl = await this.awsS3Service.getSignedDocumentUrl(key);

    return {
      message: `Aadhaar ${side} PDF uploaded successfully.`,
      signedUrl,
    };
  }

  async updatePanPdf(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ message: string; signedUrl: string }> {
    const existing = await this.prisma.panDetails.findUnique({
      where: { userId },
      select: { isPanVerified: true, panPdfKey: true },
    });

    if (existing?.isPanVerified) {
      throw new BadRequestException('PAN details have been verified by admin and cannot be edited.');
    }

    const key = await this.awsS3Service.uploadPanPdf(file, userId);

    // Delete old PDF from S3 if exists
    if (existing?.panPdfKey) {
      await this.awsS3Service.deleteFile(existing.panPdfKey).catch(() => {/* non-critical */});
    }

    await this.prisma.panDetails.upsert({
      where: { userId },
      create: { userId, panPdfKey: key },
      update: { panPdfKey: key },
    });

    const signedUrl = await this.awsS3Service.getSignedDocumentUrl(key);

    return {
      message: 'PAN PDF uploaded successfully.',
      signedUrl,
    };
  }
}


