import { NestFactory,} from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, Logger, RequestMethod,} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import session from 'express-session';
import passport from 'passport';
import { randomUUID } from 'crypto';
import { JsonLogger, requestContext } from './common/logger/json.logger';

// ── Required environment variable validation ─────────────────────────────────
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_RESET_SECRET',
  'SESSION_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'MAIL_USER',
  'MAIL_PASS',
  'ACCOUNT_NUMBER_ENCRYPTION_KEY',
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

  // ── NODE_ENV guard ────────────────────────────────────────────────────────
  // A missing or unrecognised NODE_ENV is a deployment misconfiguration.
  // We do not exit here (legacy deployments may omit it) but we warn loudly
  // so the issue surfaces in logs before anything else runs.
  const nodeEnv = process.env.NODE_ENV;
  const validEnvs = ['development', 'test', 'production'];

  if (!nodeEnv) {
    logger.warn(
      'NODE_ENV is not set. Treating as production — session cookies will be ' +
      'marked Secure and Swagger will be disabled. Set NODE_ENV=development ' +
      'for local development.',
    );
  } else if (!validEnvs.includes(nodeEnv)) {
    logger.warn(
      `NODE_ENV="${nodeEnv}" is not a recognised value. ` +
      `Expected one of: ${validEnvs.join(' | ')}.`,
    );
  }
}

async function bootstrap() {
  // Validate env before anything else
  validateEnv();

  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new JsonLogger(),
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

  // ── Request ID — propagates through AsyncLocalStorage for log correlation ───
  app.use((req: Request, res: Response, next: () => void) => {
    const requestId =
      (req.headers['x-request-id'] as string | undefined) || randomUUID();
    res.setHeader('X-Request-Id', requestId);
    requestContext.run({ requestId }, next);
  });

  // ── Session (required for Google OAuth CSRF state storage) ──────────────────
  // The session is used only for the OAuth handshake (a few seconds).
  // It is NOT used for authentication — tokens are JWT-based.
  app.use(
    session({
      secret: process.env.SESSION_SECRET!, // validated in validateEnv() above
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 5 * 60 * 1000,                          // 5 min — just enough for OAuth redirect
        httpOnly: true,
        sameSite: 'lax',
        // Secure by default — only disabled explicitly in development.
        // If NODE_ENV is unset (misconfigured production) the cookie stays
        // Secure rather than silently falling back to an insecure state.
        secure: process.env.NODE_ENV !== 'development',
      },
    }),
  );

  // ── Cookie parser (required for reading HttpOnly refresh_token cookie) ────────
  app.use(cookieParser());

  // ── Passport initialisation (must come after session) ───────────────────────
  app.use(passport.initialize());
  // Note: passport.session() is intentionally omitted — auth is stateless (JWT)

  // ── Root endpoint ───────────────────────────────────────────────────────────
  app.getHttpAdapter().get('/', (_req: Request, res: Response) => {
    return res.status(200).json({ success: true, message: 'API is working' });
  });
  // Note: GET /health is handled by AppController with real DB + Redis probes.

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
  // Exclude /health so load balancers and Kubernetes can probe without the /api prefix.
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── CORS ────────────────────────────────────────────────────────────────────
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'];

  logger.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

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

  // ── Swagger (development / test only) ───────────────────────────────────────
  // Safe-fail: explicitly allowlist dev/test rather than blocklist production.
  // If NODE_ENV is missing or any other value, Swagger is NOT exposed.
  const swaggerEnvs = ['development', 'test'];
  if (swaggerEnvs.includes(process.env.NODE_ENV ?? '')) {
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
  } else {
    logger.log(`Swagger disabled (NODE_ENV=${process.env.NODE_ENV ?? 'not set'})`);
  }

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application running on port ${port}`);
}

bootstrap();
