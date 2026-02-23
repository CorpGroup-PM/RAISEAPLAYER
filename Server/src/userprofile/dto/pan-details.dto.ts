// src/user-profile/dto/pan-details.dto.ts

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PanDetailsDto {
  @ApiProperty({
    example: 'ABCDE1234F',
    description: 'PAN number in format ABCDE1234F',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'Invalid PAN number format',
  })
  panNumber: string;

  @ApiProperty({
    example: 'Chandrasekhar Reddy',
    description: 'Name as per PAN card (alphabets and spaces only)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z ]+$/, {
    message: 'PAN name must contain only alphabets and spaces',
  })
  @MaxLength(100)
  panName: string;

  @ApiProperty({
    example: 'Some Address',
    description: 'Full address',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string.' })
  @MaxLength(200)
  address?: string;

  @ApiProperty({
    example: 'Hyderabad',
    description: 'City name',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'City must be a string.' })
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    example: 'Telangana',
    description: 'State name',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'State must be a string.' })
  @MaxLength(100)
  state?: string;

  @ApiProperty({
    example: 'India',
    description: 'Country name (required)',
  })
  @IsString({ message: 'Country must be a string.' })
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiProperty({
    example: '500001',
    description: '6-digit Indian PIN code',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[1-9][0-9]{5}$/, {
    message: 'Pincode must be a valid 6 digit number',
  })
  pincode: string;
}
