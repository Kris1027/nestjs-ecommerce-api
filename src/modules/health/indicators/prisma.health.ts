import { Injectable } from '@nestjs/common';
// HealthIndicatorService is the modern way to create custom health indicators
// HealthIndicatorResult is the proper return type for indicator methods
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

// PrismaService is our database client - we'll run a simple query to verify connectivity
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    // HealthIndicatorService helps us build properly formatted health responses
    private readonly healthIndicatorService: HealthIndicatorService,
    // PrismaService to execute a test query
    private readonly prisma: PrismaService,
  ) {}

  // Check if database is reachable
  // key: identifier that appears in the health response (e.g., "database")
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // Get an indicator builder for this key
    const indicator = this.healthIndicatorService.check(key);

    try {
      // Execute a simple query to verify database connectivity
      // SELECT 1 is the lightest possible query - just checks connection works
      await this.prisma.$queryRaw`SELECT 1`;

      // Database responded - return healthy status
      return indicator.up();
    } catch {
      // Database unreachable - return unhealthy status
      // down() causes the overall health check to fail (503 status)
      return indicator.down({ message: 'Database connection failed' });
    }
  }
}
