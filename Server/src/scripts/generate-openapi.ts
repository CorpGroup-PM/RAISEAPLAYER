/**
 * Bootstraps the NestJS app in a headless mode, generates the OpenAPI document,
 * and writes it to ../../Client/openapi.json so the client can run:
 *
 *   npx openapi-typescript openapi.json -o src/types/api.generated.d.ts
 *
 * Usage:
 *   npm run generate:openapi
 */

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../app.module';

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Raise A Player API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outPath = join(__dirname, '..', '..', '..', '..', 'Client', 'openapi.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2), 'utf8');

  console.log(`OpenAPI spec written to ${outPath}`);

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
