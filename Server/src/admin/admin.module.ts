import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminCampaignService } from './admin-fundraiser.service';
import { AdminUserService } from './admin-user.service';
import { AdminReviewService } from './admin-review.service';
import { AdminBankAccountService } from './admin-bank-account.service';
import { AdminFundraiserController } from './admin-fundraiser.controller';
import { AdminVolunteerController } from './admin-volunteer.controller';
import { AdminVolunteerService } from './admin-volunteer.service';
import { AdminPayoutsModule } from './payouts/admin.payouts.module';
import { MailModule } from 'src/mail/mail.module';
import { AwsModule } from 'src/aws/aws.module';

@Module({
  controllers: [AdminController, AdminFundraiserController, AdminVolunteerController],
  providers: [
    AdminService,
    AdminCampaignService,
    AdminUserService,
    AdminReviewService,
    AdminBankAccountService,
    AdminVolunteerService,
  ],
  imports: [AdminPayoutsModule, MailModule, AwsModule],
})
export class AdminModule {}
