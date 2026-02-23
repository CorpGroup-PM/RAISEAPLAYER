import { Module } from '@nestjs/common';
import { SupportersController } from './supporters.controller';
import { SupportersService } from './supporters.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { DonationHistoryModule } from './donation-history/donation-history.module';

@Module({
  controllers: [SupportersController],
  providers: [SupportersService,PrismaService],
  imports: [DonationHistoryModule]
})
export class SuppoertersModule {}
