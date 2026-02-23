import { Module } from '@nestjs/common';
import { AdminPayoutsController } from './admin.payouts.controller';
import { AdminPayoutsService } from './admin.payouts.service';
import { AwsS3Service } from 'src/aws/aws.service';
import { MailService } from 'src/mail/mail.service';

@Module({
  controllers: [AdminPayoutsController],
  providers: [AdminPayoutsService,AwsS3Service,MailService]
})
export class AdminPayoutsModule {}
