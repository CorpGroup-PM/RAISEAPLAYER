import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AwsS3Service } from 'src/aws/aws.service';
import { DocumentVerificationStatus } from '@prisma/client';
import { VerifyDocumentDto } from './dto/verify-document.dto';

@Injectable()
export class FundraiserDocumentsService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly awsS3Service: AwsS3Service,
    ) { }


    // UPLOAD PDF
    async uploadPdf(
        fundraiserId: string,
        file: Express.Multer.File,
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

        // uploadPdfDocument now returns the S3 key (not a public URL).
        // The key is stored in the DB; actual file access requires a signed URL.
        const s3Key = await this.awsS3Service.uploadPdfDocument(file, fundraiserId);

        const doc = await this.prisma.fundraiserDocument.create({
            data: {
                fundraiserId,
                type: dto.type,
                title: dto.title,
                fileUrl: s3Key,   // stores the key, NOT a public URL
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
                // fileUrl intentionally omitted — raw S3 key must not be
                // sent to clients; use the signed-URL endpoint instead.
            },
        });

        return {
            message: 'Document uploaded successfully. Verification is pending.',
            document: doc,
        };
    }


    // LIST OF DOCUMENTS — accessible by owner and admin
    async listDocuments(
        fundraiserId: string,
        user: { sub: string; role: 'ADMIN' | 'USER' },
    ) {
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
                    verificationStatus: DocumentVerificationStatus.VERIFIED,
                };

        const docs = await this.prisma.fundraiserDocument.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                type: true,
                verificationStatus: true,
                isPublic: true,
                fileUrl: true,   // S3 key — replaced with signed URL below
                verifiedAt: true,
            },
        });

        // Replace the stored S3 key with a 15-minute pre-signed GET URL.
        // The key is never forwarded to the client.
        const docsWithSignedUrls = await Promise.all(
            docs.map(async (doc) => {
                const { fileUrl: _key, ...rest } = doc;
                const signedUrl = await this.awsS3Service.getSignedDocumentUrl(_key);
                return { ...rest, fileUrl: signedUrl };
            }),
        );

        return docsWithSignedUrls;
    }


    // GET SIGNED URL ON DEMAND
    async getDocumentSignedUrl(
        documentId: string,
        user: { sub: string; role: 'ADMIN' | 'USER' },
    ) {
        const document = await this.prisma.fundraiserDocument.findUnique({
            where: { id: documentId },
            include: { fundraiser: { select: { creatorId: true } } },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        const isOwner = document.fundraiser.creatorId === user.sub;
        const isAdmin = user.role === 'ADMIN';

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException('Access denied');
        }

        const signedUrl = await this.awsS3Service.getSignedDocumentUrl(document.fileUrl);

        return { signedUrl, expiresInSeconds: 900 };
    }


    // DELETE DOCUMENT — owner (PENDING/REJECTED only) or admin
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

        // Only admin can delete verified documents
        if (
            document.verificationStatus === DocumentVerificationStatus.VERIFIED &&
            !isAdmin
        ) {
            throw new ForbiddenException(
                'Verified documents can only be deleted by admin',
            );
        }

        // Not owner and not admin
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException(
                'You are not allowed to delete this document',
            );
        }

        // document.fileUrl is now an S3 key; deleteFile handles both keys and legacy URLs.
        await this.awsS3Service.deleteFile(document.fileUrl);

        await this.prisma.fundraiserDocument.delete({
            where: { id: documentId },
        });

        return {
            message: 'Document deleted successfully.',
            id: documentId,
        };
    }


    // VERIFY DOCUMENT — admin only
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

        if (dto.status === 'REJECTED' && !dto.rejectionReason) {
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
                    dto.status === 'REJECTED' ? dto.rejectionReason : null,
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
