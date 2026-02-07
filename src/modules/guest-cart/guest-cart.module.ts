import { Module } from '@nestjs/common';
import { GuestCartService } from './guest-cart.service';
import { GuestCartController } from './guest-cart.controller';

@Module({
  providers: [GuestCartService],
  controllers: [GuestCartController],
  exports: [GuestCartService],
})
export class GuestCartModule {}
