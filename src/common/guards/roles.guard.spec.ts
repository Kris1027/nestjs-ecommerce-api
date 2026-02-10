import { Test, type TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function createMockExecutionContext(user?: {
    sub: string;
    email: string;
    role: string;
  }): ExecutionContext {
    const request = { user };

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  }

  describe('routes without @Roles()', () => {
    it('should allow access when no roles are required', () => {
      const context = createMockExecutionContext({
        sub: 'user-id',
        email: 'test@example.com',
        role: 'CUSTOMER',
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when roles array is empty', () => {
      reflector.getAllAndOverride.mockReturnValue([]);
      const context = createMockExecutionContext({
        sub: 'user-id',
        email: 'test@example.com',
        role: 'CUSTOMER',
      });

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('role-protected routes', () => {
    it('should allow access when user has the required role', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockExecutionContext({
        sub: 'admin-id',
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should pass correct metadata key and targets to reflector', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockExecutionContext({
        sub: 'admin-id',
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should throw ForbiddenException when user lacks the required role', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockExecutionContext({
        sub: 'user-id',
        email: 'test@example.com',
        role: 'CUSTOMER',
      });

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('Insufficient permissions'),
      );
    });
  });

  describe('missing user', () => {
    it('should throw ForbiddenException when user is not on request', () => {
      reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      const context = createMockExecutionContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(
        new ForbiddenException('User not authenticated'),
      );
    });
  });
});
