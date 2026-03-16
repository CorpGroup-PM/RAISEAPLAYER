import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CreatePayoutRequestDto {
  @ApiProperty({
    example: 25000,
    minimum: 100,
    description: 'Payout amount requested by the fundraiser creator (minimum ₹100)',
  })
  @IsNumber()
  @Min(100, { message: 'Minimum payout amount is ₹100' })
  amount: number;
}
