import { Module } from '@nestjs/common';
import { UserprofileController } from './userprofile.controller';
import { UserprofileService } from './userprofile.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AwsModule } from 'src/aws/aws.module';

@Module({
  imports: [AwsModule],
  controllers: [UserprofileController],
  providers: [UserprofileService,PrismaService]
})
export class UserprofileModule {}
