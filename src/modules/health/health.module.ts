import { Module } from '@nestjs/common';
// TerminusModule provides HealthCheckService and built-in health indicators
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
