import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CreatePayoutRequestDto {
  @ApiProperty({
    example: 25000,
    minimum: 1,
    description: 'Payout amount requested by the fundraiser creator',
  })
  @IsNumber()
  @Min(1)
  amount: number;
}
