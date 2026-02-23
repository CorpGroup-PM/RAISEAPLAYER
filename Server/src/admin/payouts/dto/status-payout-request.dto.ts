import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class StatusPayoutRequestDto {
  @ApiProperty({
    example: 'All checks passed',
    description: 'Reason for status the payout request',
  })
  @IsString()
  @MinLength(3)
  reason: string;
}
