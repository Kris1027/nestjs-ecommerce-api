import { Module } from '@nestjs/common';
// TerminusModule provides HealthCheckService and built-in health indicators
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './health.controller';
// Custom health indicator to check database connectivity
import { PrismaHealthIndicator } from './indicators/prisma.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}
