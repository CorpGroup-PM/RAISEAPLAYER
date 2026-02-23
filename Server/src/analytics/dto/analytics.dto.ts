import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class AnalyticsQueryDto {
    @ApiPropertyOptional({
        example: '2026-01-01',
        description: 'Start date (YYYY-MM-DD)',
    })
    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Invalid date format',
    })
    from?: string;

    @ApiPropertyOptional({
        example: '2026-01-21',
        description: 'End date (YYYY-MM-DD)',
    })
    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Invalid date format',
    })
    to?: string;
}
