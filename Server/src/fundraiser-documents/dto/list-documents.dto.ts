import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import {
  SportsDocumentType,
  DocumentVerificationStatus,
} from '@prisma/client';

export class ListDocumentsDto {
  @ApiPropertyOptional({
    enum: SportsDocumentType,
    description: 'Filter documents by document type',
    example: SportsDocumentType.ATHLETE_IDENTITY,
  })
  @IsOptional()
  @IsEnum(SportsDocumentType)
  type?: SportsDocumentType;

  @ApiPropertyOptional({
    enum: DocumentVerificationStatus,
    description: 'Filter by verification status (Admin use)',
    example: DocumentVerificationStatus.VERIFIED,
  })
  @IsOptional()
  @IsEnum(DocumentVerificationStatus)
  verificationStatus?: DocumentVerificationStatus;

  @ApiPropertyOptional({
    description: 'Filter by public visibility',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
