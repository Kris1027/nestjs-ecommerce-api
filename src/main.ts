import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env.validation';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.use(helmet());

  app.enableCors({
    origin: env.CORS_ORIGIN ?? true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  app.use(compression());

  await app.listen(env.PORT);
}
bootstrap().catch((err: Error) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
