import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const createRedisClient = (config: ConfigService): Redis => {
  const redisUrl = config.get<string>('REDIS_URL');

  if (!redisUrl) {
    throw new Error('❌ REDIS_URL is missing in .env');
  }

  const isTls = redisUrl.startsWith('rediss://');

  const redis = new Redis(redisUrl, {
    ...(isTls && {
      tls: {
        rejectUnauthorized: false,
      },
    }),
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  redis.on('connect', () => {
    console.log(`✅ Redis connected (${isTls ? 'TLS enabled' : 'No TLS'})`);
  });

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
  });

  return redis;
};