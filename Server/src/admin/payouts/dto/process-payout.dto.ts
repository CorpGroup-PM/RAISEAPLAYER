import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ProcessPayoutDto {
  @ApiProperty({
    example: 'TXN_98273498234',
    description: 'Payment gateway transaction ID (Razorpay / Bank reference)',
  })
  @IsString()
  transactionId: string;

  @ApiProperty({
    example: '2026-01-06T10:30:00.000Z',
    description: 'Date & time when the payout was completed',
  })
  @IsDateString()
  paymentDate: string;

  @ApiPropertyOptional({
    example: 'Transferred successfully via Razorpay',
    description: 'Optional admin notes or remarks',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  
 @ApiPropertyOptional({
    example: 'b2b3b8d2-9c84-4b7c-8b3e-3a7b1fcbf999',
    description:
      'Idempotency key to safely retry payout processing without duplicating transfers',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}