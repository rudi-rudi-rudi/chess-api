import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { loadEnv } from './config/env.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware.js';

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const requestLogging = new RequestLoggingMiddleware();
  app.use(requestLogging.use.bind(requestLogging));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(env.PORT);
}

bootstrap();
