import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { Env } from '../../config/env.validation';

// Injection token - used to @Inject(RESEND) in EmailService
export const RESEND = 'RESEND';

// Custom NestJS provider that creates a configured Resend client
export const ResendProvider: Provider = {
  provide: RESEND, // Token other services use to request this dependency
  useFactory: (configService: ConfigService<Env, true>): Resend => {
    // Resend SDK only needs the API key - simpler than Stripe/Cloudinary
    return new Resend(configService.get('RESEND_API_KEY'));
  },
  inject: [ConfigService], // NestJS injects ConfigService into useFactory
};
