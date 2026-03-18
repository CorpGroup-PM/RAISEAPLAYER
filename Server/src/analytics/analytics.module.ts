import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsPublicController } from './analytics-public.controller';
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';

@Module({
  imports: [JwtModule],
  providers: [AnalyticsService, OptionalAuthGuard],
  controllers: [AnalyticsController, AnalyticsPublicController]
})
export class AnalyticsModule {}
