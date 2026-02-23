import { Module } from '@nestjs/common';
import { PayoutRequestsController } from './payout-requests.controller';
import { PayoutRequestsService } from './payout-requests.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';

@Module({
  controllers: [PayoutRequestsController],
  providers: [PayoutRequestsService,PrismaService,MailService]
})
export class PayoutRequestsModule {}
