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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser, Roles } from '../../common/decorators';
import {
  AdminUpdateUserDto,
  ChangePasswordDto,
  CreateAddressDto,
  MessageResponseDto,
  UpdateAddressDto,
  UpdateProfileDto,
  UserAddressDto,
  UserProfileDto,
} from './dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import {
  ApiErrorResponses,
  ApiPaginatedResponse,
  ApiSuccessListResponse,
  ApiSuccessResponse,
} from '../../common/swagger';

@ApiTags('Users') // Groups all endpoints under "Users" in Swagger UI sidebar
@ApiBearerAuth('access-token') // Shows lock icon — every endpoint here requires JWT
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============================================
  // USER ENDPOINTS
  // ============================================

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiSuccessResponse(UserProfileDto, 200, 'Profile retrieved')
  @ApiErrorResponses(401, 429)
  getProfile(@CurrentUser('sub') userId: string): ReturnType<UsersService['getProfile']> {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiSuccessResponse(UserProfileDto, 200, 'Profile updated')
  @ApiErrorResponses(400, 401, 429)
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ): ReturnType<UsersService['updateProfile']> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiSuccessResponse(MessageResponseDto, 200, 'Password changed')
  @ApiErrorResponses(400, 401, 429)
  changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ): ReturnType<UsersService['changePassword']> {
    return this.usersService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  // ============================================
  // ADDRESS ENDPOINTS
  // ============================================

  @Get('me/addresses')
  @ApiOperation({ summary: 'List all addresses for current user' })
  @ApiSuccessListResponse(UserAddressDto, 'Addresses retrieved')
  @ApiErrorResponses(401, 429)
  getAddresses(@CurrentUser('sub') userId: string): ReturnType<UsersService['getAddresses']> {
    return this.usersService.getAddresses(userId);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Create a new address' })
  @ApiSuccessResponse(UserAddressDto, 201, 'Address created')
  @ApiErrorResponses(400, 401, 429)
  createAddress(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateAddressDto,
  ): ReturnType<UsersService['createAddress']> {
    return this.usersService.createAddress(userId, dto);
  }

  @Get('me/addresses/:id')
  @ApiOperation({ summary: 'Get a single address by ID' })
  @ApiParam({ name: 'id', description: 'Address CUID' })
  @ApiSuccessResponse(UserAddressDto, 200, 'Address retrieved')
  @ApiErrorResponses(401, 403, 404, 429)
  getAddress(
    @CurrentUser('sub') userId: string,
    @Param('id') addressId: string,
  ): ReturnType<UsersService['getAddress']> {
    return this.usersService.getAddress(userId, addressId);
  }

  @Patch('me/addresses/:id')
  @ApiOperation({ summary: 'Update an existing address' })
  @ApiParam({ name: 'id', description: 'Address CUID' })
  @ApiSuccessResponse(UserAddressDto, 200, 'Address updated')
  @ApiErrorResponses(400, 401, 403, 404, 429)
  updateAddress(
    @CurrentUser('sub') userId: string,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ): ReturnType<UsersService['updateAddress']> {
    return this.usersService.updateAddress(userId, addressId, dto);
  }

  @Delete('me/addresses/:id')
  @ApiOperation({ summary: 'Delete an address' })
  @ApiParam({ name: 'id', description: 'Address CUID' })
  @ApiSuccessResponse(MessageResponseDto, 200, 'Address deleted')
  @ApiErrorResponses(401, 403, 404, 429)
  deleteAddress(
    @CurrentUser('sub') userId: string,
    @Param('id') addressId: string,
  ): ReturnType<UsersService['deleteAddress']> {
    return this.usersService.deleteAddress(userId, addressId);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all users (admin)' })
  @ApiPaginatedResponse(UserProfileDto, 'Paginated user list')
  @ApiErrorResponses(401, 403, 429)
  findAll(@Query() query: PaginationQueryDto): ReturnType<UsersService['findAll']> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  @ApiParam({ name: 'id', description: 'User CUID' })
  @ApiSuccessResponse(UserProfileDto, 200, 'User retrieved')
  @ApiErrorResponses(401, 403, 404, 429)
  findById(@Param('id') userId: string): ReturnType<UsersService['findById']> {
    return this.usersService.findById(userId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user role, status, or profile (admin)' })
  @ApiParam({ name: 'id', description: 'User CUID' })
  @ApiSuccessResponse(UserProfileDto, 200, 'User updated')
  @ApiErrorResponses(400, 401, 403, 404, 429)
  adminUpdateUser(
    @Param('id') userId: string,
    @Body() dto: AdminUpdateUserDto,
  ): ReturnType<UsersService['adminUpdateUser']> {
    return this.usersService.adminUpdateUser(userId, dto);
  }

  @Post(':id/deactivate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a user account (admin)' })
  @ApiParam({ name: 'id', description: 'User CUID' })
  @ApiSuccessResponse(MessageResponseDto, 200, 'User deactivated')
  @ApiErrorResponses(400, 401, 403, 404, 429)
  deactivateUser(@Param('id') userId: string): ReturnType<UsersService['deactivateUser']> {
    return this.usersService.deactivateUser(userId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Permanently delete a user (admin)' })
  @ApiParam({ name: 'id', description: 'User CUID' })
  @ApiSuccessResponse(MessageResponseDto, 200, 'User deleted')
  @ApiErrorResponses(401, 403, 404, 429)
  hardDeleteUser(@Param('id') userId: string): ReturnType<UsersService['hardDeleteUser']> {
    return this.usersService.hardDeleteUser(userId);
  }
}
