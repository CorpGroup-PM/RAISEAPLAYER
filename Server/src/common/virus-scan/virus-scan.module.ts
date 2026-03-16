import { Global, Module } from '@nestjs/common';
import { VirusScanService } from './virus-scan.service';

@Global()
@Module({
  providers: [VirusScanService],
  exports: [VirusScanService],
})
export class VirusScanModule {}
