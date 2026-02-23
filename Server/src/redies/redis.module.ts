import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisClient } from './redis.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => createRedisClient(config),
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}