import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from './prisma/prisma.service';
import { SeedUtils } from './common/Utils/seed.util';
import type { Response } from 'express';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.getHttpAdapter().get('/', (_req , res: Response) => {
    return res.status(200).json({
     success: true,
     message: 'API is working',
    });
});


  //  Capture RAW body for webhooks (Razorpay-safe)
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

  // GLOBAL CONFIG
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  app.set('trust proxy', 1);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        stopAtFirstError: true, 
        forbidNonWhitelisted: true,
        }),
    );
  // --- RUN ADMIN SEED ---
  const prismaService = app.get(PrismaService);
  await SeedUtils.seedAdmin(prismaService);

  // --- SWAGGER CONFIG ---
  const config = new DocumentBuilder()
    .setTitle('Auth System API')
    .setDescription(
      'Industrial grade Authentication with Access/Refresh tokens, RBAC, and OTP',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
