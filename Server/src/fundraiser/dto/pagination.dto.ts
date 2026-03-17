import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    example: 0,
    description: 'Page number (0-based index)',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number;

  // -------------------------
  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items per page',
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;


  @ApiPropertyOptional({ example: 'cricket', description: 'Search keyword', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Search term must not exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9 .,'"\-]+$/, {
    message: 'Search term contains invalid characters',
  })
  search?: string;
}
