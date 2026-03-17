import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { AdminModule } from './admin/admin.module';
import { UserprofileModule } from './userprofile/userprofile.module';
import { FundraiserModule } from './fundraiser/fundraiser.module';
import { FundraiserDocumentsModule } from './fundraiser-documents/fundraiser-documents.module';
import { RecipientAccountModule } from './recipient-account/recipient-account.module';
import { PaymentsModule } from './payments/payments.module';
import { SuppoertersModule } from './donation/supporters.module';
import { PayoutRequestsModule } from './payout-requests/payout-requests.module';
import { RedisModule } from './redies/redis.module';
import { PayoutsModule } from './payouts/payouts.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReceiptService } from './receipt/receipt.service';
import { ContactusModule } from './contactus/contactus.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { VirusScanModule } from './common/virus-scan/virus-scan.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    VirusScanModule,
    ThrottlerModule.forRootAsync({
     imports: [RedisModule],
     inject: ['REDIS_CLIENT'],
     useFactory: (redis) => ({
        throttlers: [
         {
            name: 'short',
            ttl: 60,
            limit: 3,
         },
         {
            name: 'medium',
            ttl: 10,
            limit: 20,
         },
         {
            name: 'long',
            ttl: 60,
            limit: 100,
         },
         // 3 contact-form submissions per hour per IP
         {
            name: 'contact',
            ttl: 3600000,
            limit: 3,
         },
         // 20 payment order creations per hour per IP
         {
            name: 'payment',
            ttl: 3600000,
            limit: 20,
         },
         // 20 file uploads per hour per IP
         {
            name: 'upload',
            ttl: 3600000,
            limit: 20,
         },
         // 30 public read requests per minute per IP
         {
            name: 'public',
            ttl: 60000,
            limit: 30,
         },
        ],
        storage: new ThrottlerStorageRedisService(redis),
     }),
    }),

    PrismaModule,
    UsersModule,
    AuthModule,
    MailModule,
    AdminModule,
    UserprofileModule,
    FundraiserModule,
    FundraiserDocumentsModule,
    RecipientAccountModule,
    PaymentsModule,
    SuppoertersModule,
    PayoutRequestsModule,
    PayoutsModule,
    ContactusModule,
    AnalyticsModule,
  
  ],
  controllers: [AppController,],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    ReceiptService,
  ],
})
export class AppModule {}
