import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RazorpayService} from './razorpay.service';
import { AuthModule } from 'src/auth/auth.module';
import { WebhooksController } from './webhooks/webhooks.controller';
import { WebhooksService } from './webhooks/webhooks.service';
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';
import { IpThrottlerGuard } from 'src/common/guards/throttler/ip-throttler.guard';
import { MailModule } from 'src/mail/mail.module';
import { ReceiptService } from 'src/receipt/receipt.service';

@Module({
  imports: [AuthModule,MailModule,],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, RazorpayService, WebhooksService, OptionalAuthGuard, IpThrottlerGuard, ReceiptService]
})
export class PaymentsModule {}
