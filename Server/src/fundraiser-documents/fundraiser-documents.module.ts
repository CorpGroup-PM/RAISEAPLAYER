import { Module } from '@nestjs/common';
import { FundraiserDocumentsController } from './fundraiser-documents.controller';
import { FundraiserDocumentsService } from './fundraiser-documents.service';
import { AwsModule } from 'src/aws/aws.module';

@Module({
  imports: [AwsModule],
  controllers: [FundraiserDocumentsController],
  providers: [FundraiserDocumentsService]
})
export class FundraiserDocumentsModule {}
