import 'dotenv/config';
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const isLocal =
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1');

    // Production: enforce SSL cert verification to prevent MITM attacks.
    // Set DATABASE_CA_CERT (PEM string) if your provider uses a custom CA
    // (e.g. Supabase, Neon). Most public-CA-signed providers work without it.
    let sslConfig: object | undefined;
    if (!isLocal) {
      sslConfig = process.env.DATABASE_CA_CERT
        ? { rejectUnauthorized: true, ca: process.env.DATABASE_CA_CERT }
        : { rejectUnauthorized: true };
    }

    const pool = new Pool({
      connectionString,
      ...(sslConfig ? { ssl: sslConfig } : {}),
    });
    const adapter = new PrismaPg(pool);

    const isProd = process.env.NODE_ENV === 'production';

    // Explicitly calling super() often fixes the initialization issue
    super({
      // Use 'event' instead of 'stdout' so Prisma log output goes through
      // NestJS Logger (structured JSON) rather than raw console writes.
      //
      // 'info' is intentionally excluded in production: Prisma info-level
      // events can include query parameters (hashed passwords, OTP hashes,
      // encrypted account numbers) which must never appear in production logs.
      log: [
        ...(!isProd ? [{ emit: 'event' as const, level: 'info' as const }] : []),
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
      adapter,
    });

    this.pool = pool;
  }

  async onModuleInit() {
    // Route Prisma log events through NestJS Logger so they appear in
    // structured JSON output rather than being written directly to stdout.
    // 'info' subscription is skipped in production — it is not registered in
    // the log config above, so subscribing would be a no-op, but guard
    // explicitly here for clarity.
    if (process.env.NODE_ENV !== 'production') {
      (this.$on as any)('info', (e: { message: string }) => this.logger.log(e.message));
    }
    (this.$on as any)('warn',  (e: { message: string }) => this.logger.warn(e.message));
    (this.$on as any)('error', (e: { message: string; target: string }) =>
      this.logger.error(e.message, e.target),
    );

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}