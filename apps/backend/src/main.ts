import 'reflect-metadata';
import { randomUUID } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { createCorsOptions } from './cors.config';
import { setupSwagger } from './swagger.setup';
import { createHstsConfig, shouldTrustProxy } from './transport-security.config';
import { createValidationPipeOptions } from './validation-pipe.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  if (shouldTrustProxy(config)) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.use(helmet({ hsts: createHstsConfig(config) }));
  app.use(compression());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] ?? randomUUID();
    next();
  });
  app.enableCors(createCorsOptions(config));
  app.useGlobalPipes(new ValidationPipe(createValidationPipeOptions()));
  app.useGlobalFilters(new HttpExceptionFilter());
  setupSwagger(app);

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
}

bootstrap();
