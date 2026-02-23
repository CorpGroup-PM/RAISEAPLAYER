import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { PayoutRequestsService } from './payout-requests.service';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';

@ApiTags('Payout Requests')
@ApiBearerAuth()
@Controller('payout-requests')
@UseGuards(AccessTokenGuard)
export class PayoutRequestsController {
  constructor(
    private readonly payoutRequestsService: PayoutRequestsService,
  ) { }

  // ------------------------------------------------------------------
  // CREATE PAYOUT REQUEST
  // ------------------------------------------------------------------
  @Post(':fundraiserId/payout-requests')
  @ApiOperation({
    summary: 'Create payout request',
    description:
      'Create a payout request for a specific fundraiser. Only the fundraiser owner can request payouts.',
  })
  @ApiParam({
    name: 'fundraiserId',
    description: 'Fundraiser ID',
    example: 'fundraiser-uuid',
  })
  @ApiBody({ type: CreatePayoutRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Payout request created successfully',
    example: {
      id: 'payout-request-id',
      fundraiserId: 'fundraiser-uuid',
      amount: 25000,
      status: 'PENDING',
      createdAt: '2026-01-06T11:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid payout amount or insufficient balance',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async create(
    @Req() req: any,
    @Param('fundraiserId') fundraiserId: string,
    @Body() dto: CreatePayoutRequestDto,
  ) {
    const userId = req.user.sub;

    return this.payoutRequestsService.createPayoutRequest(
      userId,
      fundraiserId,
      dto,
    );
  }

  // ------------------------------------------------------------------
  // LIST PAYOUT REQUESTS
  // ------------------------------------------------------------------
  @Get(':fundraiserId/payout-requests')
  @ApiOperation({
    summary: 'List payout requests',
    description:
      'List all payout requests created for a fundraiser by the logged-in user',
  })
  @ApiParam({
    name: 'fundraiserId',
    description: 'Fundraiser ID',
    example: 'fundraiser-uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Payout requests fetched successfully',
    example: [
      {
        id: 'payout-request-id',
        amount: 25000,
        status: 'PENDING',
        createdAt: '2026-01-05T10:00:00.000Z',
      },
      {
        id: 'payout-request-id-2',
        amount: 15000,
        status: 'APPROVED',
        createdAt: '2026-01-03T08:30:00.000Z',
      },
    ],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async list(
    @Req() req: any,
    @Param('fundraiserId') fundraiserId: string,
  ) {
    const userId = req.user.sub;

    return this.payoutRequestsService.listPayoutRequests(
      userId,
      fundraiserId,
    );
  }


  //
  //Delete
  //
  @Delete(':fundraiserId/payout-requests/:requestId')
  @ApiOperation({
    summary: 'Cancel payout request (creator)',
    description: 'Allows the fundraiser creator to cancel a pending payout request.',
  })
  async cancelPayoutRequest(
    @Req() req: any,
    @Param('fundraiserId') fundraiserId: string,
    @Param('requestId') requestId: string,
  ) {
    const userId = req.user.sub;
    return this.payoutRequestsService.cancelPayoutRequest(
      userId,
      fundraiserId,
      requestId,
    );
  }
}
