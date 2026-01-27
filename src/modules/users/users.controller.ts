import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators';
import { ChangePasswordDto, CreateAddressDto, UpdateAddressDto, UpdateProfileDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser('sub') userId: string): ReturnType<UsersService['getProfile']> {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ): ReturnType<UsersService['updateProfile']> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ): ReturnType<UsersService['changePassword']> {
    return this.usersService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @Get('me/addresses')
  getAddresses(@CurrentUser('sub') userId: string): ReturnType<UsersService['getAddresses']> {
    return this.usersService.getAddresses(userId);
  }

  @Post('me/addresses')
  createAddress(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateAddressDto,
  ): ReturnType<UsersService['createAddress']> {
    return this.usersService.createAddress(userId, dto);
  }

  @Get('me/addresses/:id')
  getAddress(
    @CurrentUser('sub') userId: string,
    @Param('id') addressId: string,
  ): ReturnType<UsersService['getAddress']> {
    return this.usersService.getAddress(userId, addressId);
  }

  @Patch('me/addresses/:id')
  updateAddress(
    @CurrentUser('sub') userId: string,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ): ReturnType<UsersService['updateAddress']> {
    return this.usersService.updateAddress(userId, addressId, dto);
  }

  @Delete('me/addresses/:id')
  deleteAddress(
    @CurrentUser('sub') userId: string,
    @Param('id') addressId: string,
  ): ReturnType<UsersService['deleteAddress']> {
    return this.usersService.deleteAddress(userId, addressId);
  }
}
