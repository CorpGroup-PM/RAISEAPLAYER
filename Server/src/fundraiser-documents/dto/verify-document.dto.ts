import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentVerificationStatus } from '@prisma/client';

export class VerifyDocumentDto {
    @ApiProperty({
        enum: DocumentVerificationStatus,
        description: 'Verification decision by admin',
        example: DocumentVerificationStatus.VERIFIED,
    })
    @IsEnum(DocumentVerificationStatus)
    status: DocumentVerificationStatus;

    @ApiPropertyOptional({
        description: 'Reason for rejection (required only when status is REJECTED)',
        example: 'Document is unclear or unreadable',
    })
    @IsOptional()
    @IsString()
    rejectionReason?: string;
}
