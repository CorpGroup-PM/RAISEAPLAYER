import { Module } from '@nestjs/common';
import { FundraiserController } from './fundraiser.controller';
import { FundraiserService } from './fundraiser.service';
import { AwsS3Service } from 'src/aws/aws.service';
import { FundraiserStatsModule } from './fundraiser-stats/fundraiser-stats.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailModule } from 'src/mail/mail.module';
import { IpThrottlerGuard } from 'src/common/guards/throttler/ip-throttler.guard';

@Module({
  controllers: [FundraiserController],
  providers: [FundraiserService, AwsS3Service, PrismaService, IpThrottlerGuard],
  imports: [FundraiserStatsModule, MailModule]
})
export class FundraiserModule {}
