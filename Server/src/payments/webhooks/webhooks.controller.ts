import { Controller, Headers, Post, Req } from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { WebhooksService } from './webhooks.service';

@SkipThrottle() // Razorpay webhook — signature-verified, must never be rate-limited
@ApiTags('Webhooks')
@Controller('razorpay')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
  ) {}

  @Post('webhook')
  @ApiExcludeEndpoint() // Hide from Swagger UI (best practice)
  @ApiOperation({
    summary: 'Razorpay webhook endpoint',
    description:
      'Receives Razorpay payment events. Signature is verified using raw request body.',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleRazorpayWebhook(
    @Req() req: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    await this.webhooksService.handleRazorpayEvent(
      req.body,     // parsed payload
      req.rawBody,  // raw Buffer (required for signature verification)
      signature,
    );

    return { status: 'ok' };
  }
}
