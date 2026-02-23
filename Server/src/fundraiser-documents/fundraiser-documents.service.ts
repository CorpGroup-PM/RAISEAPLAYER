import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AwsS3Service } from 'src/aws/aws.service';
import { DocumentVerificationStatus } from '@prisma/client';
import { VerifyDocumentDto } from './dto/verify-document.dto';

@Injectable()
export class FundraiserDocumentsService {

    constructor(private readonly prisma: PrismaService,
        private readonly awsS3Service: AwsS3Service) { }


    //UPLOAD PDF
    async uploadPdf(fundraiserId: string, file: Express.Multer.File,
        dto: CreateDocumentDto,
        userId: string,
    ) {
        const fundraiser = await this.prisma.fundraiser.findUnique({
            where: { id: fundraiserId },
            select: { id: true, creatorId: true },
        });
        
        if (!fundraiser) {
            throw new NotFoundException('fundraiser not Found');
        }

        if (fundraiser.creatorId !== userId) {
            throw new ForbiddenException('You do not own this fundraiser');
        }

        const fileUrl = await this.awsS3Service.uploadPdfDocument(file, fundraiserId,);

        const doc = await this.prisma.fundraiserDocument.create({
            data: {
                fundraiserId,
                type: dto.type,
                title: dto.title,
                fileUrl,
                mimeType: file.mimetype,
                fileSize: file.size,
                isPublic: dto.isPublic ?? false,
                verificationStatus: 'PENDING',
            },
            select: {
                id: true,
                type: true,
                verificationStatus: true,
                isPublic: true,
                fileUrl: true,
            },
        });

        return {
            message: 'Document uploaded successfully. Verification is pending.',
            document: doc,
        };
    }

    //LIST OF DOCUMENTS ACCESS BY BOTH USER AND ADMIN
    async listDocuments(
        fundraiserId: string,
        user: { sub: string; role: 'ADMIN' | 'USER' },) {
        const fundraiser = await this.prisma.fundraiser.findUnique({
            where: { id: fundraiserId },
            select: { creatorId: true },
        });


        if (!fundraiser) {
            throw new NotFoundException('Fundraiser not found');
        }

        const isOwner = fundraiser.creatorId === user.sub;
        const isAdmin = user.role === 'ADMIN';

        const whereCondition =
            isOwner || isAdmin
                ? { fundraiserId }
                : {
                    fundraiserId,
                    //  isPublic: true,
                    verificationStatus: DocumentVerificationStatus.VERIFIED,
                };

        return this.prisma.fundraiserDocument.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                type: true,
                verificationStatus: true,
                isPublic: true,
                fileUrl: true,
                verifiedAt: true,
            },
        });
    }


    // DELETE DOCUMENT BY ADMIN AFTER VERIFY AND BEFORE VERIFY IT CAN BE DELETE BY USER ALSO 
    async deleteDocument(
        documentId: string,
        user: { sub: string; role: 'ADMIN' | 'USER' },
    ) {
        const document = await this.prisma.fundraiserDocument.findUnique({
            where: { id: documentId },
            include: {
                fundraiser: {
                    select: { creatorId: true },
                },
            },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        const isOwner = document.fundraiser.creatorId === user.sub;
        const isAdmin = user.role === 'ADMIN';

        //  only admin can delete
        if (
            document.verificationStatus === DocumentVerificationStatus.VERIFIED &&
            !isAdmin
        ) {
            throw new ForbiddenException(
                'Verified documents can only be deleted by admin',
            );
        }

        //  Not user and not admin
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException(
                'You are not allowed to delete this document',
            );
        }

        //  Delete from S3
        await this.awsS3Service.deleteFile(document.fileUrl);

        //  Delete from DB
        await this.prisma.fundraiserDocument.delete({
            where: { id: documentId },
        });

        return {
            message: 'Document deleted successfully.',
            id: documentId,
        };
    }

    //VERIFIED DOCUMENT BY ADMIN
    async verifyDocument(
        documentId: string,
        dto: VerifyDocumentDto,
        adminUserId: string,
    ) {
        
        const document = await this.prisma.fundraiserDocument.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        if (
            dto.status === 'REJECTED' &&
            !dto.rejectionReason
        ) {
            throw new BadRequestException(
                'Rejection reason is required when rejecting a document',
            );
        }

        const updated = await this.prisma.fundraiserDocument.update({
            where: { id: documentId },
            data: {
                verificationStatus: dto.status,
                verifiedBy: adminUserId,
                verifiedAt: dto.status === 'VERIFIED' ? new Date() : null,
                rejectionReason:
                    dto.status === 'REJECTED'
                        ? dto.rejectionReason
                        : null,
            },
            select: {
                id: true,
                verificationStatus: true,
                verifiedAt: true,
            },
        });

        return {
            message:
                dto.status === 'VERIFIED'
                    ? 'Document verified successfully.'
                    : 'Document rejected.',
            document: updated,
        };
    }

}
