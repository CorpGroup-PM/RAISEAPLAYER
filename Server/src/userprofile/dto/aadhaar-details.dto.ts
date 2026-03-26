import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AadhaarDetailsDto {
  @ApiProperty({
    example: '123456789012',
    description: 'Aadhaar number (12 digits)',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Aadhaar number is required' })
  @Matches(/^[0-9]{12}$/, { message: 'Aadhaar number must be exactly 12 digits' })
  aadhaarNumber: string;
}
