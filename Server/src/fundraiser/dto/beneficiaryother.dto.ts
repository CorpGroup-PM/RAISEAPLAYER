import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class BeneficiaryOtherDto {
  @ApiProperty({
    example: 'Rahul Sharma',
    description: 'Full name of the beneficiary',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150, { message: 'Beneficiary name must not exceed 150 characters' })
  name: string;

  // -------------------------
  @ApiProperty({
    example: 'Brother',
    description: 'Relation of the beneficiary to the campaign creator',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Relation must not exceed 100 characters' })
  relation: string;

  // -------------------------
  @ApiPropertyOptional({
    example: '9876543210',
    description: 'Valid 10-digit Indian mobile number',
  })
  @IsOptional()
  @IsNotEmpty()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Phone number must be a valid 10 digit Indian mobile number',
  })
  phoneNumber?: string;

  // -------------------------
  @ApiPropertyOptional({
    example: 'rahul.sharma@example.com',
    description: 'Valid email address of the beneficiary',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email format.' })
  email?: string;

  // -------------------------
  @ApiProperty({
    example: 22,
    description: 'Age of the beneficiary',
    minimum: 0,
    maximum: 120,
  })
  @IsInt()
  @Min(0)
  @Max(120)
  age: number;
}