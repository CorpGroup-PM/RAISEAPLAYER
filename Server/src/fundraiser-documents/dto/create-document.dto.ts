import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean, IsString, MaxLength } from 'class-validator';
import { SportsDocumentType } from '@prisma/client';

export class CreateDocumentDto {
  @ApiProperty({
    enum: SportsDocumentType,
    description: 'Type of sports document being uploaded',
    example: SportsDocumentType.ATHLETE_IDENTITY,
  })
  @IsEnum(SportsDocumentType)
  type: SportsDocumentType;

  @ApiPropertyOptional({
    description: 'Optional title or description of the document',
    example: 'Player Aadhaar Card',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Whether the document is publicly visible after verification',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}