import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminFundraiserService } from './admin-fundraiser.service';
import { AdminFundraiserController } from './admin-fundraiser.controller';
import { AdminPayoutsModule } from './payouts/admin.payouts.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  controllers: [AdminController,AdminFundraiserController],
  providers: [AdminService,AdminFundraiserService],
  imports: [AdminPayoutsModule, MailModule,],
})
export class AdminModule {}
