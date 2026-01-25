import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Env } from '../../config/env.validation';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Env, true>) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN'),
        },
      }),
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
