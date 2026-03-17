import { CampaignFor } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BeneficiaryOtherDto } from './beneficiaryother.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFundraiserDto {
  // -------------------------
  // Campaign Type
  // -------------------------

   @ApiProperty({
    enum: CampaignFor,
    example: CampaignFor.OTHER,
    description: 'Who the campaign is created for',
  })
  @IsEnum(CampaignFor)
  campaignFor: CampaignFor;


  @ApiPropertyOptional({
    type: () => BeneficiaryOtherDto,
    description:
      'Required only when campaignFor is OTHER',
  })
  @ValidateNested()
  @Type(() => BeneficiaryOtherDto)
  @IsOptional()
  beneficiaryOther?: BeneficiaryOtherDto;

  // -------------------------
  // Content
  // -------------------------
  @ApiProperty({
    example: 'Support My Cricket Journey',
    minLength: 5,
    maxLength: 120,
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(5, { message: 'Title must be at least 5 characters' })
  @MaxLength(120, { message: 'Title cannot exceed 120 characters' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiProperty({
    example: 'Raising funds for state-level cricket training',
    maxLength: 220,
  })
  @IsString({ message: 'Short description must be a string' })
  @IsNotEmpty({ message: 'Short description is required' })
  @MaxLength(220, {
    message: 'Short description cannot exceed 220 characters',
  })
  @Transform(({ value }) => value?.trim())
  shortDescription: string;

  @ApiProperty({
    example: 'I have been selected for state-level tournaments...',
    minLength: 50,
    maxLength: 5000,
  })
  @IsString({ message: 'Story must be a string' })
  @IsNotEmpty({ message: 'Story is required' })
  @MinLength(50, {
    message: 'Story must be at least 50 characters',
  })
  @MaxLength(5000, {
    message: 'Story cannot exceed 5000 characters',
  })
  @Transform(({ value }) => value?.trim())
  story: string;
  // -------------------------
  // Sport info
  // -------------------------
  @ApiProperty({
    example: 'Cricket',
    description: 'Primary sport for the campaign',
  })
  @IsString()
  sport: string;

  // -------------------------
  @ApiPropertyOptional({
    example: 'Batting',
    description: 'Specific discipline within the sport',
  })
  @IsOptional()
  @IsString()
  discipline?: string;

  // -------------------------
  @ApiPropertyOptional({
    example: 'Intermediate',
    description: 'Player skill level',
  })
  @IsOptional()
  @IsString()
  level?: string;

  // -------------------------
  @ApiProperty({
    type: [String],
    example: ['Batting', 'Fielding', 'Reflexes'],
    description: 'List of player skills',
  })
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(20, { message: 'Skills cannot exceed 20 items' })
  @IsString({ each: true })
  @MaxLength(50, { each: true, message: 'Each skill cannot exceed 50 characters' })
  skills: string[];
  // -------------------------
  // Location
  // -------------------------
   @ApiProperty({
    example: 'Mumbai',
    description: 'City where the campaign or player is based',
  })
  @IsString()
  city: string;

  // -------------------------
  @ApiProperty({
    example: 'Maharashtra',
    description: 'State where the campaign or player is based',
  })
  @IsString()
  state: string;

  // -------------------------
  @ApiPropertyOptional({
    example: 'India',
    description: 'Country (defaults to India if not provided)',
  })
  @IsOptional()
  @IsString()
  country?: string;

  // -------------------------
  // Media
  // -------------------------
  @ApiPropertyOptional({
    example: 'https://cdn.raiseaplayer.com/fundraisers/cover.jpg',
    description: 'Cover image URL for the fundraiser',
  })
  @IsOptional()
  @IsString()
  coverImageURL?: string;

  // -------------------------
  // Money
  // -------------------------
  @ApiProperty({
    example: 250000,
    description: 'Target amount to be raised (minimum ₹1000)',
    minimum: 1000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(1000, { message: 'Goal amount must be at least ₹1000' })
  goalAmount: number;
}
