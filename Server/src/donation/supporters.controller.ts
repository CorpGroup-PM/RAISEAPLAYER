import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupportersService } from './supporters.service';

@ApiTags('Fundraiser Supporters')
@Controller('fundraisers-supporters')
export class SupportersController {
  constructor(
    private readonly supportersService: SupportersService,
  ) {}

  @Get(':id/supporters')
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
