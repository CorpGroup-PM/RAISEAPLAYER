import { Module } from '@nestjs/common';
import { UserprofileController } from './userprofile.controller';
import { UserprofileService } from './userprofile.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AwsModule } from 'src/aws/aws.module';
import { IpThrottlerGuard } from 'src/common/guards/throttler/ip-throttler.guard';

@Module({
  imports: [AwsModule],
  controllers: [UserprofileController],
  providers: [UserprofileService, PrismaService, IpThrottlerGuard]
})
export class UserprofileModule {}
