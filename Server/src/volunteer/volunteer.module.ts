import { Module } from '@nestjs/common';
import { VolunteerService } from './volunteer.service';
import { VolunteerController } from './volunteer.controller';
import { AwsModule } from 'src/aws/aws.module';

@Module({
  imports:     [AwsModule],
  controllers: [VolunteerController],
  providers:   [VolunteerService],
  exports:     [VolunteerService],
})
export class VolunteerModule {}
