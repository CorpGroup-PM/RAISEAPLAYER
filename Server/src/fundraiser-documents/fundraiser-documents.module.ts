import { Module } from '@nestjs/common';
import { FundraiserDocumentsController } from './fundraiser-documents.controller';
import { FundraiserDocumentsService } from './fundraiser-documents.service';
import { AwsModule } from 'src/aws/aws.module';
import { IpThrottlerGuard } from 'src/common/guards/throttler/ip-throttler.guard';

@Module({
  imports: [AwsModule],
  controllers: [FundraiserDocumentsController],
  providers: [FundraiserDocumentsService, IpThrottlerGuard]
})
export class FundraiserDocumentsModule {}
