import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// HealthIndicatorResult is the proper return type for indicator methods
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
// Redis is the client library used by BullMQ
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator {
  // Store Redis client instance for reuse
  private readonly redis: Redis;

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly configService: ConfigService,
  ) {
    // Create a dedicated Redis connection for health checks
    // Using the same REDIS_URL that BullMQ uses
    // getOrThrow() guarantees string return type (throws if missing)
    const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');
    this.redis = new Redis(redisUrl, {
      // Don't block startup if Redis is initially unavailable
      lazyConnect: true,
      // Quick timeout for health checks - we don't want slow probes
      connectTimeout: 5000,
      // Disable retries for health checks - we want fast failure
      maxRetriesPerRequest: 1,
    });
  }

  // Check if Redis is reachable
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      // PING is the standard way to check Redis connectivity
      // Returns "PONG" if successful, throws on connection failure
      await this.redis.ping();

      // If ping succeeded without throwing, Redis is healthy
      return indicator.up();
    } catch {
      // Redis unreachable - return unhealthy status
      return indicator.down({ message: 'Redis connection failed' });
    }
  }

  // Clean up Redis connection when the app shuts down
  // Use timeout + fallback to prevent hanging during shutdown if Redis is unresponsive
  async onModuleDestroy(): Promise<void> {
    const QUIT_TIMEOUT_MS = 1000;

    try {
      // Try graceful quit with timeout
      await Promise.race([
        this.redis.quit(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis quit timeout')), QUIT_TIMEOUT_MS),
        ),
      ]);
    } catch {
      // If quit() fails or times out, forcibly close the connection
      this.redis.disconnect();
    }
  }
}
