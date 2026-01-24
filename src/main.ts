import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env.validation';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { Logger } from 'nestjs-pino';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  const httpAdapterHost = app.get(HttpAdapterHost);

  // Global exception filter - catches all errors
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));

  // Global response interceptor - wraps all successful responses
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(env.PORT);
}
bootstrap().catch((err: Error) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
