import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { Env } from '../../config/env.validation';

// Injection token - used to @Inject(CLOUDINARY) in other services
export const CLOUDINARY = 'CLOUDINARY';

// Custom NestJS provider that configures the Cloudinary SDK
export const CloudinaryProvider: Provider = {
  provide: CLOUDINARY,
  useFactory: (configService: ConfigService<Env, true>) => {
    return cloudinary.config({
      cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get('CLOUDINARY_API_KEY'),
      api_secret: configService.get('CLOUDINARY_API_SECRET'),
    });
  },
  inject: [ConfigService],
};
