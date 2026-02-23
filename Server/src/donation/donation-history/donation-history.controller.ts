import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { DonationHistoryService } from './donation-history.service';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { PaymentStatus } from '@prisma/client';

@ApiTags('My Donations')
@ApiBearerAuth()
@Controller('me')
@UseGuards(AccessTokenGuard)
export class DonationHistoryController {
  constructor(
    private readonly donationHistoryService: DonationHistoryService,
  ) { }

  @Get('donations')
  @ApiOperation({
    summary: 'Get my donation history',
    description:
      'Fetch logged-in user’s donation history (only SUCCESS donations). No filters or pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'Donation history fetched successfully',
    example: {
      total: 2,
      items: [
        {
          donationId: 'donation-id-1',
          fundraiserId: 'fundraiser-id',
          fundraiserTitle: 'Help me train for Nationals',
          donationAmount: '2000.00',
          platformTipAmount: '50.00',
          totalPaid: '2050.00',
          currency: 'INR',
          status: 'SUCCESS',
          donatedAt: '2026-01-06T08:30:00.000Z',
          receiptDownloadUrl: '/me/donations/donation-id-1/receipt',
        },
        {
          donationId: 'donation-id-2',
          fundraiserId: 'fundraiser-id-2',
          fundraiserTitle: 'Tournament Travel Fund',
          donationAmount: '1000.00',
          platformTipAmount: '0.00',
          totalPaid: '1000.00',
          currency: 'INR',
          status: 'SUCCESS',
          donatedAt: '2026-01-02T10:10:00.000Z',
          receiptDownloadUrl: '/me/donations/donation-id-2/receipt',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (invalid or missing access token)',
  })
  async getMyDonations(@Req() req: any) {
    const userId = req.user.sub;
    return this.donationHistoryService.getUserDonations(userId);
  }

  @Get('donations/:donationId/receipt')
  @ApiOperation({
    summary: 'Download donation receipt (PDF)',
    description:
      'Download the PDF receipt for a successful donation made by the logged-in user',
  })
  @ApiResponse({
    status: 200,
    description: 'Donation receipt PDF',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied or receipt not available',
  })
  @ApiResponse({
    status: 404,
    description: 'Donation not found',
  })
  async downloadReceipt(
    @Req() req: any,
    @Param('donationId') donationId: string,
    @Res() res: Response,
  ) {
    const userId = req.user.sub;

    const pdfBuffer =
      await this.donationHistoryService.generateReceiptForDonation(
        userId,
        donationId,
      );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="donation-receipt-${donationId}.pdf"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    res.end(pdfBuffer);
  }

}

