import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateDonationDto {
  @ApiProperty({
    example: 'fundraiser-uuid',
    description: 'Fundraiser ID to which the donation is made',
  })
  @IsString()
  fundraiserId: string;

  @ApiProperty({
    example: 1500,
    minimum: 1,
    maximum: 500000,
    description: 'Donation amount (must be between ₹1 and ₹5,00,000)',
  })
  @IsNumber()
  @Min(1)
  @Max(500000, { message: 'Donation amount cannot exceed ₹5,00,000' })
  donationAmount: number;

  @ApiProperty({
    example: 100,
    minimum: 0,
    description: 'Optional platform tip amount',
  })
  @IsNumber()
  @Min(0)
  platformTipAmount: number;

  @ApiProperty({
    example: false,
    description: 'Whether the donation is anonymous',
  })
  @IsBoolean()
  isAnonymous: boolean;

  @ApiPropertyOptional({
    example: 'Rahul Sharma',
    description:
      'Guest donor name (required if donating without login)',
  })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiPropertyOptional({
    example: 'rahul@example.com',
    description:
      'Guest donor email (required if donating without login)',
  })
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @ApiPropertyOptional({
    example: '9876543210',
    description:
      'Guest donor mobile number (required if donating without login)',
  })
  @IsOptional()
  @IsString()
  guestMobile?: string;
}
