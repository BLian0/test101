import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import { join } from 'node:path';

import { AppModule } from './app.module';
import { parseAccessToken } from './common/auth-token';
import { RequestContextService } from './common/request-context.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const requestContext = app.get(RequestContextService);

  app.enableCors();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );
  app.use('/media', express.static(join(process.cwd(), 'uploads')));
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const bearerToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : null;
    const userId = parseAccessToken(bearerToken);

    requestContext.run({ userId }, next);
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

bootstrap();
