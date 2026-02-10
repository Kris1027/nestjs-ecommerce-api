import { Test, type TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { createMockJwtService } from '@test/mocks/common.mock';
import { IS_PUBLIC_KEY } from '../decorators';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    jwtService = createMockJwtService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: jwtService },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn().mockReturnValue(false) },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function createMockExecutionContext(authHeader?: string): ExecutionContext {
    const request = {
      headers: { authorization: authHeader },
    };

    return {
      getHandler: jest.fn().mockReturnValue('mockHandler'),
      getClass: jest.fn().mockReturnValue('mockClass'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  }

  describe('public routes', () => {
    it('should allow access when @Public() is set', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockExecutionContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should pass correct metadata key and targets to reflector', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockExecutionContext();

      await guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('protected routes', () => {
    it('should allow access with a valid Bearer token', async () => {
      const context = createMockExecutionContext('Bearer valid-token');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
    });

    it('should attach decoded user payload to request object', async () => {
      const context = createMockExecutionContext('Bearer valid-token');
      const request = context.switchToHttp().getRequest();

      await guard.canActivate(context);

      expect(request.user).toEqual({
        sub: 'user-id',
        email: 'test@example.com',
        role: 'CUSTOMER',
      });
    });
  });

  describe('missing or invalid token', () => {
    it('should throw UnauthorizedException when no Authorization header', async () => {
      const context = createMockExecutionContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Missing access token'),
      );
    });

    it('should throw UnauthorizedException when scheme is not Bearer', async () => {
      const context = createMockExecutionContext('Basic some-credentials');

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Missing access token'),
      );
    });

    it('should throw UnauthorizedException when token is expired or invalid', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      const context = createMockExecutionContext('Bearer expired-token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired access token'),
      );
    });
  });
});
