import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const port = process.env.API_PORT ?? 3333;
  app.setGlobalPrefix('api');
  await app.listen(port);
  Logger.log(`Shellff API running on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
