import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminCampaignService } from './admin-fundraiser.service';
import { AdminUserService } from './admin-user.service';
import { AdminReviewService } from './admin-review.service';
import { AdminBankAccountService } from './admin-bank-account.service';
import { AdminFundraiserController } from './admin-fundraiser.controller';
import { AdminPayoutsModule } from './payouts/admin.payouts.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  controllers: [AdminController, AdminFundraiserController],
  providers: [
    AdminService,
    AdminCampaignService,
    AdminUserService,
    AdminReviewService,
    AdminBankAccountService,
  ],
  imports: [AdminPayoutsModule, MailModule],
})
export class AdminModule {}
