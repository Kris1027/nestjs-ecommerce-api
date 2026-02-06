import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService, type TokenResponse } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, TokenResponseDto } from './dto';
import { Public } from '../../common/decorators';
import { MessageResponseDto } from '../users/dto';
import { ApiSuccessResponse, ApiErrorResponses } from '../../common/swagger';

@ApiTags('Auth')
@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiSuccessResponse(TokenResponseDto, 201, 'User registered successfully')
  @ApiErrorResponses(400, 409, 429)
  async register(@Body() dto: RegisterDto, @Req() req: Request): Promise<TokenResponse> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;

    return this.authService.register(dto, userAgent, ipAddress);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  @ApiSuccessResponse(TokenResponseDto, 200, 'Login successful')
  @ApiErrorResponses(400, 401, 429)
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<TokenResponse> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;

    return this.authService.login(dto, userAgent, ipAddress);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange refresh token for new token pair' })
  @ApiSuccessResponse(TokenResponseDto, 200, 'Tokens refreshed')
  @ApiErrorResponses(400, 401, 429)
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request): Promise<TokenResponse> {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;

    return this.authService.refreshTokens(dto.refreshToken, userAgent, ipAddress);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate a refresh token' })
  @ApiSuccessResponse(MessageResponseDto, 200, 'Logged out successfully')
  @ApiErrorResponses(400, 429)
  async logout(@Body() dto: RefreshTokenDto): Promise<{ message: string }> {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }
}
