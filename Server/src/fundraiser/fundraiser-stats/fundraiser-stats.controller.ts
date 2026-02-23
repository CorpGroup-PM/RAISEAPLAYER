import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FundraiserStatsService } from './fundraiser-stats.service';

@ApiTags('Fundraiser Stats')
@Controller('fundraiser-stats')
export class FundraiserStatsController {
  constructor(
    private readonly fundraiserStatsService: FundraiserStatsService,
  ) {}

  @Get(':id/donate-widget')
  @ApiOperation({
    summary: 'Get donate widget stats',
    description:
      'Fetch public donation widget statistics for a fundraiser (used on fundraiser page)',
  })
  @ApiParam({
    name: 'id',
    description: 'Fundraiser ID',
    example: 'fundraiser-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Donate widget stats fetched successfully',
    example: {
      fundraiserId: 'fundraiser-uuid',
      goalAmount: 500000,
      raisedAmount: 185000,
      totalSupporters: 124,
      progressPercentage: 37,
      lastDonationAt: '2026-01-06T07:45:00.000Z',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Fundraiser not found',
  })
  async getDonateWidget(
    @Param('id') fundraiserId: string,
  ) {
    return this.fundraiserStatsService.getDonateWidgetStats(
      fundraiserId,
    );
  }
}
