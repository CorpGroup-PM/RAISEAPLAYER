import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransferStatus } from '@prisma/client';

export class AdminListPayoutRequestsDto {
  @ApiPropertyOptional({
    enum: TransferStatus,
    example: TransferStatus.PENDING,
    description: 'Filter by payout request status',
  })
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @ApiPropertyOptional({
    example: 'fundraiser_uuid',
    description: 'Filter by fundraiser ID',
  })
  @IsOptional()
  @IsString()
  fundraiserId?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Page number (starts from 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @ApiPropertyOptional({
    example: 20,
    description: 'Items per page (max 50)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
