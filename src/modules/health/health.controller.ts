import { Controller, Get } from '@nestjs/common';
// HealthCheckService orchestrates running multiple health indicators
// HealthCheck decorator formats the response as a proper health check response
// HealthCheckResult is the return type for health check methods
import { HealthCheck, HealthCheckResult, HealthCheckService } from '@nestjs/terminus';

// @Public() bypasses JWT authentication - health checks must be accessible without auth
import { Public } from '../../common/decorators';
// Custom indicators to check service connectivity
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';

@Controller('health')
export class HealthController {
  constructor(
    // Orchestrates running all health checks
    private readonly health: HealthCheckService,
    // Database health indicator
    private readonly prismaHealth: PrismaHealthIndicator,
    // Redis/queue health indicator
    private readonly redisHealth: RedisHealthIndicator,
  ) {}

  // GET /health - Liveness probe
  // Kubernetes calls this to check if the process is alive
  // Should be fast with no external dependencies
  @Get()
  @Public()
  @HealthCheck()
  checkLiveness(): Promise<HealthCheckResult> {
    // Empty array = just check if the app responds
    // This is intentionally minimal - liveness should be fast
    return this.health.check([]);
  }

  // GET /health/ready - Readiness probe
  // Kubernetes calls this to check if the app can handle traffic
  // Checks all critical dependencies (database, redis, etc.)
  @Get('ready')
  @Public()
  @HealthCheck()
  checkReadiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Check database connectivity
      () => this.prismaHealth.isHealthy('database'),
      // Check Redis connectivity (required for BullMQ queues)
      () => this.redisHealth.isHealthy('redis'),
    ]);
  }
}
