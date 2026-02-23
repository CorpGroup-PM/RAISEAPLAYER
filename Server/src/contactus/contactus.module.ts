import { Module } from '@nestjs/common';
import { ContactusController } from './contactus.controller';
import { ContactusService } from './contactus.service';
import { MailService } from 'src/mail/mail.service';

@Module({
  controllers: [ContactusController],
  providers: [ContactusService,MailService]
})
export class ContactusModule {}
