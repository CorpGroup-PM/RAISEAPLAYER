import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { Roles } from "src/common/decorators/roles.decorator";
import { AccessTokenGuard } from "src/common/guards/accessToken.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsQueryDto } from "./dto/analytics.dto";
import { parseAnalyticsDateRange, parseAnalyticsDateRangeWithStrings } from './analytics-date.util';

@ApiTags('Admin Analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AnalyticsController {
    constructor(private readonly service: AnalyticsService) { }

    @Get('overview')
    @ApiOperation({ summary: 'Admin analytics overview (KPI cards)' })
    async overview(@Query() query: AnalyticsQueryDto) {
        const { from, to, fromDate, toDate } =
            parseAnalyticsDateRangeWithStrings(query);

        const cards = await this.service.getOverview({ fromDate, toDate });

        return {
            range: { from, to },
            cards,
        };
    }



    @Get('fundraisers')
    @ApiOperation({ summary: 'Admin fundraiser analytics (day-wise)' })
    async fundraisers(@Query() query: AnalyticsQueryDto) {
        const { from, to, fromDate, toDate } =
            parseAnalyticsDateRangeWithStrings(query);

        const data = await this.service.getFundraiserAnalytics({
            fromDate,
            toDate,
        });

        return {
            range: { from, to },
            ...data,
        };
    }

    @Get('donations')
    @ApiOperation({ summary: 'Admin donation & revenue analytics (day-wise)' })
    async donations(@Query() query: AnalyticsQueryDto) {
        const { from, to, fromDate, toDate } =
            parseAnalyticsDateRangeWithStrings(query);

        const data = await this.service.getDonationAnalytics({
            fromDate,
            toDate,
        });

        return {
            range: { from, to },
            ...data,
        };
    }

    @Get("withdrawals")
    @ApiOperation({ summary: "Admin withdrawals & payouts analytics (day-wise)" })
    async withdrawals() {

        return await this.service.getWithdrawalsAnalytics();
    }

    @Get('payouts')
    @ApiOperation({ summary: 'Get PAID payouts (date range)' })
    async getPaidPayouts(@Query() query: AnalyticsQueryDto) {
        const { from, to, fromDate, toDate } =
            parseAnalyticsDateRangeWithStrings(query);

        const data = await this.service.getPaidPayouts({
            fromDate,
            toDate,
        });

        return {
            range: { from, to },
            ...data,
        };
    }


    @Get('documents')
    @ApiOperation({ summary: 'Admin documents & compliance analytics' })
    async documents(@Query() query: AnalyticsQueryDto) {
        // keep date parser consistent across analytics
        parseAnalyticsDateRangeWithStrings(query);

        return this.service.getDocumentsAnalytics();
    }
}
