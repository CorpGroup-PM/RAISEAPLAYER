import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SportsDocumentType, UserRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { IpThrottlerGuard } from 'src/common/guards/throttler/ip-throttler.guard';
import { validateUploadedFile } from 'src/common/upload/validate-uploaded-file';
import { CreateDocumentDto } from './dto/create-document.dto';
import { FundraiserDocumentsService } from './fundraiser-documents.service';
import { VerifyDocumentDto } from './dto/verify-document.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('fundraiser-documents')
export class FundraiserDocumentsController {

    constructor(private readonly fundraiserDocumentsService: FundraiserDocumentsService) { }

    @Post(':fundraiserId/documents')
    @ApiOperation({
        summary: 'Upload fundraiser document',
        description: 'Uploads a PDF document for a fundraiser with metadata such as type, title, and visibility.',
    })
    @UseGuards(IpThrottlerGuard, AccessTokenGuard)
    @Throttle({ upload: { limit: 20, ttl: 3600000 } })
    @UseInterceptors(
        FileInterceptor('document', {
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
            fileFilter: (_, file, cb) => {
                if (file.mimetype !== 'application/pdf') {
                    return cb(new Error('Only PDF files are allowed'), false);
                }
                cb(null, true);
            },
        }),
    )
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                document: { type: 'string', format: 'binary' },
                type: {
                    enum: Object.values(SportsDocumentType),
                    example: SportsDocumentType.ATHLETE_IDENTITY,
                },
                title: { type: 'string', example: 'Player Identity Proof' },
                isPublic: { type: 'boolean', example: false },
            },
            required: ['document', 'type'],
        },
    })
    async uploadPdfDocument(
        @Param('fundraiserId') fundraiserId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CreateDocumentDto,
        @Req() req,
    ) {
        // Magic bytes validation — confirms file content is genuinely PDF,
        // catching spoofed Content-Type headers before reaching the service layer.
        await validateUploadedFile(file, ['application/pdf'], 5);

        return this.fundraiserDocumentsService.uploadPdf(
            fundraiserId,
            file,
            dto,
            req.user.sub,
        );
    }


    @Get(':fundraiserId/documents')
    @UseGuards(AccessTokenGuard)
    @ApiOperation({
        summary: 'List fundraiser documents (role-aware)',
        description: 'Retrieves fundraiser documents based on user role.',
    })
    @ApiResponse({
        status: 200,
        description: 'Documents retrieved successfully',
        schema: {
            example: [
                {
                    id: 'doc_xxx',
                    type: 'ATHLETE_IDENTITY',
                    verificationStatus: 'VERIFIED',
                    isPublic: false,
                    fileUrl: 'https://bucket.s3.region.amazonaws.com/...',
                    verifiedAt: '2025-01-01T10:00:00Z',
                },
            ],
        },
    })
    async listDocuments(
        @Param('fundraiserId') fundraiserId: string,
        @Req() req,
    ) {
        // req.user is populated by AccessTokenGuard
        return this.fundraiserDocumentsService.listDocuments(
            fundraiserId,
            req.user,
        );
    }




    @Delete('documents/:documentId')
    @UseGuards(AccessTokenGuard)
    @ApiOperation({
        summary: 'Delete a fundraiser document',
        description:
            'Owner can delete PENDING/REJECTED documents. VERIFIED documents can be deleted only by Admin.',
    })
    @ApiParam({
        name: 'documentId',
        description: 'Document ID to delete',
        example: 'doc_xxx',
    })
    @ApiResponse({
        status: 200,
        description: 'Document deleted successfully',
        schema: {
            example: {
                id: 'doc_xxx',
            },
        },
    })
    @ApiResponse({
        status: 403,
        description:
            'Forbidden: Verified documents can only be deleted by admin',
    })
    @ApiResponse({
        status: 404,
        description: 'Document not found',
    })
    async deleteDocument(
        @Param('documentId') documentId: string,
        @Req() req,
    ) {
        return this.fundraiserDocumentsService.deleteDocument(
            documentId,
            req.user, // { id, role }
        );
    }


    /**
     * Generate a 15-minute pre-signed URL for a private document.
     * Only the fundraiser owner and admins may request this.
     */
    @Get('documents/:documentId/signed-url')
    @UseGuards(AccessTokenGuard)
    @ApiOperation({
        summary: 'Get a pre-signed download URL for a document (15 min TTL)',
        description: 'Returns a time-limited S3 pre-signed URL. Only the fundraiser owner or an admin may call this endpoint.',
    })
    @ApiParam({ name: 'documentId', description: 'Document ID', example: 'doc_xxx' })
    @ApiResponse({
        status: 200,
        description: 'Signed URL generated',
        schema: {
            example: {
                signedUrl: 'https://bucket.s3.region.amazonaws.com/fundraisers/.../uuid.pdf?X-Amz-Signature=...',
                expiresInSeconds: 900,
            },
        },
    })
    @ApiResponse({ status: 403, description: 'Access denied' })
    @ApiResponse({ status: 404, description: 'Document not found' })
    async getSignedUrl(
        @Param('documentId') documentId: string,
        @Req() req,
    ) {
        return this.fundraiserDocumentsService.getDocumentSignedUrl(documentId, req.user);
    }


    // verified By Admin Document in
    @Patch('admin/documents/:documentId/verify')
    @UseGuards(AccessTokenGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Admin verify or reject fundraiser document',
        description: 'Allows an admin to verify or reject a fundraiser document.',
    })
    @ApiParam({
        name: 'documentId',
        description: 'Document ID',
        example: 'doc_xxx',
    })
    @ApiResponse({
        status: 200,
        description: 'Document verification updated',
        schema: {
            example: {
                id: 'doc_xxx',
                verificationStatus: 'VERIFIED',
                verifiedAt: '2025-01-01T10:00:00Z',
            },
        },
    })
    async verifyDocument(
        @Param('documentId') documentId: string,
        @Body() dto: VerifyDocumentDto,
        @Req() req,
    ) {
        return this.fundraiserDocumentsService.verifyDocument(
            documentId,
            dto,
            req.user.sub, // admin userId
        );
    }
}

