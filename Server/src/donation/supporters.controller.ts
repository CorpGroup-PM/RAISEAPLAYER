import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SupportersService } from './supporters.service';
import { IpThrottlerGuard } from 'src/common/guards/throttler/ip-throttler.guard';

@ApiTags('Fundraiser Supporters')
@Controller('fundraisers-supporters')
export class SupportersController {
  constructor(
    private readonly supportersService: SupportersService,
  ) {}

  @Get(':id/supporters')
  @UseGuards(IpThrottlerGuard)
  @Throttle({ public: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get fundraiser supporters',
    description: 'Fetch all supporters of a fundraiser',
  })
  @ApiParam({
    name: 'id',
    description: 'Fundraiser ID',
    example: 'fundraiser-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Supporters fetched successfully',
    example: {
      total: 2,
      items: [
        {
          displayName: 'John Doe',
          amount: '1500.00',
          currency: 'INR',
          donatedAt: '2026-01-06T09:45:00.000Z',
        },
      ],
    },
  })
  async getSupporters(
    @Param('id') fundraiserId: string,
  ) {
    return this.supportersService.getSupporters(fundraiserId);
  }
}
