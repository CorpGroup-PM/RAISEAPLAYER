import { IsDateString, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateActivityDto {
  @ApiProperty({ example: '2026-03-30' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'Helped set up the fundraiser event in Delhi' })
  @IsString()
  @MinLength(5)
  note: string;

  @ApiProperty({ example: 'Arjun Sharma - Football Campaign' })
  @IsString()
  @MinLength(2)
  helpedCampaign: string;
}
