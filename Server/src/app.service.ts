import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { PrismaService } from './prisma/prisma.service';

export interface HealthResult {
  status: 'ok' | 'degraded';
  db: 'connected' | 'error';
  redis: 'connected' | 'error';
  uptime: number;
  timestamp: string;
}

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  async checkHealth(): Promise<HealthResult> {
    const [db, redis] = await Promise.all([
      this.checkDb(),
      this.checkRedis(),
    ]);

    const status = db === 'connected' && redis === 'connected' ? 'ok' : 'degraded';

    return {
      status,
      db,
      redis,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDb(): Promise<'connected' | 'error'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'connected';
    } catch {
      return 'error';
    }
  }

  private async checkRedis(): Promise<'connected' | 'error'> {
    try {
      const pong = await this.redis.ping();
      return pong === 'PONG' ? 'connected' : 'error';
    } catch {
      return 'error';
    }
  }
}
