import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from './prisma/prisma.service';
import { SeedUtils } from './common/Utils/seed.util';
import type { Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';

// ── Required environment variable validation ─────────────────────────────────
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'MAIL_USER',
  'MAIL_PASS',
] as const;

function validateEnv(): void {
  const logger = new Logger('Bootstrap');
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
    process.exit(1);
  }
}

async function bootstrap() {
  // Validate env before anything else
  validateEnv();

  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // ── Security headers (helmet) ───────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ── Session (required for Google OAuth CSRF state storage) ──────────────────
  // The session is used only for the OAuth handshake (a few seconds).
  // It is NOT used for authentication — tokens are JWT-based.
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'oauth-handshake-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 5 * 60 * 1000,                          // 5 min — just enough for OAuth redirect
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );

  // ── Passport initialisation (must come after session) ───────────────────────
  app.use(passport.initialize());
  // Note: passport.session() is intentionally omitted — auth is stateless (JWT)

  // ── Health / root endpoints ─────────────────────────────────────────────────
  app.getHttpAdapter().get('/', (_req: Request, res: Response) => {
    return res.status(200).json({ success: true, message: 'API is working' });
  });

  app.getHttpAdapter().get('/health', (_req: Request, res: Response) => {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // ── Capture RAW body for Razorpay webhook signature verification ────────────
  app.use(
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(
    bodyParser.urlencoded({
      extended: true,
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  // ── Global config ───────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── CORS ────────────────────────────────────────────────────────────────────
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.set('trust proxy', 1);

  // ── Global validation pipe ──────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ── Admin seed ──────────────────────────────────────────────────────────────
  const prismaService = app.get(PrismaService);
  await SeedUtils.seedAdmin(prismaService);

  // ── Swagger (non-production only) ───────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Raise A Player API')
      .setDescription(
        'Authentication with Access/Refresh tokens, RBAC, and OTP. Fundraising & Payments.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger docs available at /api/docs');
  }

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application running on port ${port}`);
}

bootstrap();
