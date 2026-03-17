import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { PaymentsService } from './payments.service';
import { CreateDonationDto } from './dto/create.donation.dto';
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';
import { IpThrottlerGuard } from 'src/common/guards/throttler/ip-throttler.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) { }

  @Post('create-order')
  @UseGuards(IpThrottlerGuard, OptionalAuthGuard)
  @Throttle({ payment: { limit: 20, ttl: 3600000 } })
  @ApiOperation({
    summary: 'Create donation payment order',
    description:
      'Creates a payment order for a donation. Can be used by logged-in users or guest donors.',
  })
  @ApiBody({ type: CreateDonationDto })
  @ApiBearerAuth() // optional (works even without token)
  @ApiResponse({
    status: 201,
    description: 'Payment order created successfully',
    example: {
      orderId: 'order_Ks9d83h',
      amount: 160000,
      currency: 'INR',
      donationId: 'donation-uuid',
      isGuest: false,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid donation data',
  })
  async createOrder(
    @Body() dto: CreateDonationDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub; // may be undefined (guest)

    return this.paymentsService.createOrder(
      dto,
      userId,
    );
  }
}
