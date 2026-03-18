import { Module } from '@nestjs/common';
import { FoundationController } from './foundation.controller';
import { FoundationService } from './foundation.service';
import { RazorpayService } from 'src/payments/razorpay.service';
import { AuthModule } from 'src/auth/auth.module';
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';

@Module({
  imports: [AuthModule],
  controllers: [FoundationController],
  providers: [FoundationService, RazorpayService, OptionalAuthGuard],
  exports: [FoundationService],
})
export class FoundationModule {}
