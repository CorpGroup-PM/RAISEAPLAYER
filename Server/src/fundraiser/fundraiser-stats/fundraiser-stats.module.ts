import { Module } from '@nestjs/common';
import { FundraiserStatsController } from './fundraiser-stats.controller';
import { FundraiserStatsService } from './fundraiser-stats.service';

@Module({
  controllers: [FundraiserStatsController],
  providers: [FundraiserStatsService]
})
export class FundraiserStatsModule {}
