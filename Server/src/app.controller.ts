import { Controller, Get, Res, VERSION_NEUTRAL, Version } from '@nestjs/common';
import type { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService, HealthResult } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return 'Welcome to Raise a player By Developer team';
  }

  /**
   * Liveness / readiness health check.
   *
   * Performs real connectivity probes:
   *   - Database: SELECT 1 via Prisma
   *   - Redis: PING via ioredis
   *
   * Returns HTTP 200 when all dependencies are reachable,
   * HTTP 503 when any probe fails so load balancers and
   * Kubernetes stop routing traffic to the unhealthy instance.
   *
   * VERSION_NEUTRAL ensures the route is served at /health
   * without any /v1 prefix, which is the standard path that
   * AWS ALB, GCP, and Kubernetes probe.
   */
  @Get('health')
  @Version(VERSION_NEUTRAL)
  @SkipThrottle() // Load-balancer / Kubernetes liveness probe — must never be blocked
  async getHealth(@Res({ passthrough: true }) res: Response): Promise<HealthResult> {
    const result = await this.appService.checkHealth();
    res.status(result.status === 'ok' ? 200 : 503);
    return result;
  }
}
