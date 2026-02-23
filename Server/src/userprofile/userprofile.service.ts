import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import path from 'path';
import { UpdateProfileDto } from 'src/userprofile/dto/updateprofile.dto';
import { AwsS3Service } from 'src/aws/aws.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { validateUploadedFile } from 'src/common/upload/validate-uploaded-file';

@Injectable()
export class UserprofileService {

    constructor(private prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly awsS3Service: AwsS3Service,
    ) { }

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
            include: { panDetails: true }
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
            panDetails: user.panDetails ?? null,
        };
    }


    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const { firstName, lastName, phoneNumber, panDetails } = dto;

        //  Checking user exist
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException("User not found");

        //  Update user basic profile (all required in dto)
        await this.prisma.user.update({
            where: { id: userId },
            data: { firstName, lastName, phoneNumber }
        });

        //  PAN details update and create
        if (panDetails) {
            await this.prisma.panDetails.upsert({
                where: { userId },
                create: {
                    userId,
                    ...panDetails,
                },
                update: {
                    ...panDetails,
                }
            });
        }

        //  Fetching and updating data
        const updated = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { panDetails: true },
        });

        if (!updated) throw new NotFoundException("User not found");

        return {
            message: 'Profile updated successfully.',
            id: updated.id,
            firstName: updated.firstName,
            lastName: updated.lastName,
            phoneNumber: updated.phoneNumber,
            panDetails: updated.panDetails
        };
    }

    async updateProfilePicture(
        userId: string,
        file: Express.Multer.File,
    ): Promise<{ profilePictureURL: string }> {
        validateUploadedFile(
            file,
            ['image/png', 'image/jpg', 'image/jpeg'],
            5,
        );

        try {
            const imageUrl = await this.awsS3Service.uploadProfileImage(
                file,
                userId,
            );

            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    profileImageUrl: imageUrl,
                },
            });
            return { profilePictureURL: imageUrl, };
        } catch (error) {
            console.error('Profile picture upload failed:', error);
            throw new InternalServerErrorException(
                'Profile picture upload failed. Please try again later.',
            );
        }
    }

}


