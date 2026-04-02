import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyPortalDto {
  @ApiProperty({ example: 'NRPF202603300001' })
  @IsString()
  volunteerId: string;

  @ApiPropertyOptional({ description: 'Not required for Google OAuth users' })
  @IsOptional()
  @IsString()
  password?: string;
}
