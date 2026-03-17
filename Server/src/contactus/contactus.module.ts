import { Module } from '@nestjs/common';
import { ContactusController } from './contactus.controller';
import { ContactusService } from './contactus.service';
import { MailService } from 'src/mail/mail.service';
import { IpThrottlerGuard } from 'src/common/guards/throttler/ip-throttler.guard';

@Module({
  controllers: [ContactusController],
  providers: [ContactusService, MailService, IpThrottlerGuard]
})
export class ContactusModule {}
