import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFoundationDonationDto {
  @ApiProperty({ example: 500, description: 'Donation amount in INR' })
  @IsNumber()
  @Min(1)
  amount: number;

  // Guest-only fields (ignored for logged-in users)
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  guestEmail?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  guestMobile?: string;
}
