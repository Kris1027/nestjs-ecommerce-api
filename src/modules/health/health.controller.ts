import { Controller, Get } from '@nestjs/common';
// HealthCheckService orchestrates running multiple health indicators
// HealthCheck decorator formats the response as a proper health check response
// HealthCheckResult is the return type for health check methods
import { HealthCheck, HealthCheckResult, HealthCheckService } from '@nestjs/terminus';

// @Public() bypasses JWT authentication - health checks must be accessible without auth
import { Public } from '../../common/decorators';

@Controller('health')
export class HealthController {
  // Inject HealthCheckService to orchestrate our health checks
  constructor(private readonly health: HealthCheckService) {}

  // GET /health - Liveness probe
  // Kubernetes calls this to check if the process is alive
  @Get()
  @Public() // No authentication required - must be accessible by load balancers
  @HealthCheck() // Formats response with status, info, error, and details fields
  checkLiveness(): Promise<HealthCheckResult> {
    // Empty array = just check if the app responds
    // This is intentionally minimal - liveness should be fast
    return this.health.check([]);
  }
}
