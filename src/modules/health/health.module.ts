import { Module } from '@nestjs/common';
// TerminusModule provides HealthCheckService and built-in health indicators
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
// Custom health indicators to check service connectivity
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    // Database connectivity check
    PrismaHealthIndicator,
    // Redis/queue connectivity check
    RedisHealthIndicator,
  ],
})
export class HealthModule {}
