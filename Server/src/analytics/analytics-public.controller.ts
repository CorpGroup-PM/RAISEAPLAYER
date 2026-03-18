import { Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiExcludeController()
@Controller('analytics')
export class AnalyticsPublicController {
    constructor(private readonly service: AnalyticsService) {}

    @Post('sponsor-click')
    @HttpCode(HttpStatus.OK)
    @UseGuards(OptionalAuthGuard)
    async trackSponsorClick(@Req() req: Request & { user?: any }) {
        const userType = req.user?.sub ? 'USER' : 'GUEST';
        await this.service.trackSponsorClick(userType);
        return { ok: true };
    }
}
