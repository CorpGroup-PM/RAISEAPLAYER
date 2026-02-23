import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PayoutsService } from './payouts.service';

@ApiTags('Fundraiser Payouts')
@Controller('fundraisers')
export class PayoutsController {
  constructor(
    private readonly payoutsService: PayoutsService,
  ) {}

  @Get(':fundraiserId/payouts')
  @ApiOperation({
    summary: 'Get public payout history',
    description:
      'Fetch publicly visible payout history for a fundraiser',
  })
  @ApiParam({
    name: 'fundraiserId',
    description: 'Fundraiser ID',
    example: 'fundraiser-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Payout history fetched successfully',
    example: [
      {
        id: 'payout-id',
        amount: 25000,
        processedAt: '2026-01-05T12:00:00.000Z',
        transactionId: 'TXN_982734',
      },
      {
        id: 'payout-id-2',
        amount: 15000,
        processedAt: '2025-12-30T09:30:00.000Z',
        transactionId: 'TXN_762345',
      },
    ],
  })
  @ApiResponse({
    status: 404,
    description: 'Fundraiser not found',
  })
  async getPayouts(
    @Param('fundraiserId') fundraiserId: string,
  ) {
    return this.payoutsService.getPublicPayouts(
      fundraiserId,
    );
  }
}
