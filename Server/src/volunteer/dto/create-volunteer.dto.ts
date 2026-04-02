import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVolunteerDto {
  @ApiProperty({ example: 'Hyderabad' })
  @IsString()
  @MinLength(2)
  city: string;

  @ApiPropertyOptional({ example: 'I want to support young athletes.' })
  @IsOptional()
  @IsString()
  message?: string;
}
