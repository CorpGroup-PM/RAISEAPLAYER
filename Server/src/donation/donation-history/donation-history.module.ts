import { Module } from '@nestjs/common';
import { DonationHistoryController } from './donation-history.controller';
import { DonationHistoryService } from './donation-history.service';
import { ReceiptService } from 'src/receipt/receipt.service';

@Module({
  controllers: [DonationHistoryController],
  providers: [DonationHistoryService,ReceiptService]
})
export class DonationHistoryModule {}
