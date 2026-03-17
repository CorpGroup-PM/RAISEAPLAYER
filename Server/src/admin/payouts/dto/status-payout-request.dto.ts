import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class StatusPayoutRequestDto {
  @ApiProperty({
    example: 'All checks passed',
    description: 'Reason for status the payout request',
    maxLength: 500,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason: string;
}
