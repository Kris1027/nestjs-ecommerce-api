import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { Env } from '../../config/env.validation';

// Injection token - used to @Inject(STRIPE) in PaymentsService
export const STRIPE = 'STRIPE';

// Custom NestJS provider that creates a configured Stripe client
export const StripeProvider: Provider = {
  provide: STRIPE,
  useFactory: (configService: ConfigService<Env, true>): Stripe => {
    return new Stripe(configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-01-28.clover',
    });
  },
  inject: [ConfigService],
};
