import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(env.PORT);
}
bootstrap().catch((err: Error) => {
  console.error('Failed to start application', err);
  process.exit(1);
});
