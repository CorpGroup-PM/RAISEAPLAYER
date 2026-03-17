// src/recipient-account/dto/upsert-recipient-account.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator';
import { RecipientType } from '@prisma/client';

export class CreateAndUpsertRecipientAccountDto {
  @ApiProperty({
    enum: RecipientType,
    example: RecipientType.PARENT_GUARDIAN,
    description: 'Who will receive the funds for this fundraiser',
  })
  @IsEnum(RecipientType)
  recipientType: RecipientType;

  @ApiProperty({
    example: 'Ramesh',
    description: 'Recipient first name',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    example: 'Kumar',
    description: 'Recipient last name',
  })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Bank account number (9–18 digits). Omit to keep existing value on update.',
  })
  @IsOptional()
  @ValidateIf((o: CreateAndUpsertRecipientAccountDto) => !!o.accountNumber)
  @IsString()
  @Matches(/^\d+$/, { message: 'Account number must contain digits only' })
  @Length(9, 18, { message: 'Account number must be between 9 and 18 digits' })
  accountNumber?: string;

  @ApiProperty({
    example: 'HDFC Bank',
    description: 'Bank name',
  })
  @IsString()
  bankName: string;

  @ApiProperty({
    example: 'India',
    description: 'Country of the bank account',
  })
  @IsString()
  country: string;

  @ApiPropertyOptional({
    example: 'HDFC0001234',
    description: 'IFSC code (required for Indian bank accounts)',
  })
  @ApiPropertyOptional({
    example: 'HDFC0001234',
    description: 'IFSC code (11 characters, RBI standard)',
  })
  @IsOptional()
  @IsString()
  @Length(11, 11, {
    message: 'IFSC code must be exactly 11 characters',
  })
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
    message: 'Invalid IFSC code format',
  })
  ifscCode?: string;
}
