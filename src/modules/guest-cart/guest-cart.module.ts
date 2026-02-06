import { Module } from '@nestjs/common';
import { GuestCartService } from './guest-cart.service';
import { GuestCartController } from './guest-cart.controller';

@Module({
  providers: [GuestCartService],
  controllers: [GuestCartController],
})
export class GuestCartModule {}
