import {
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { type HttpAdapterHost } from '@nestjs/core';
import { GlobalExceptionFilter } from './http-exception.filter';
import { Prisma } from '../../generated/prisma/client.js';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockReply: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    mockReply = jest.fn();

    const httpAdapterHost = {
      httpAdapter: { reply: mockReply },
    } as unknown as HttpAdapterHost;

    filter = new GlobalExceptionFilter(httpAdapterHost);

    jest.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);
    jest.spyOn(filter['logger'], 'warn').mockImplementation(() => undefined);

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ url: '/test/path' }),
        getResponse: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function getResponseBody(): Record<string, unknown> {
    return mockReply.mock.calls[0][1] as Record<string, unknown>;
  }

  function getStatusCode(): number {
    return mockReply.mock.calls[0][2] as number;
  }

  describe('response format', () => {
    it('should return standardized error response structure', () => {
      filter.catch(new NotFoundException('Not found'), mockHost);

      const body = getResponseBody();
      expect(body).toEqual(
        expect.objectContaining({
          success: false,
          statusCode: 404,
          message: 'Not found',
          error: 'Not Found',
          path: '/test/path',
        }),
      );
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('HttpException handling', () => {
    it('should handle NotFoundException', () => {
      filter.catch(new NotFoundException('User not found'), mockHost);

      expect(getStatusCode()).toBe(404);
      expect(getResponseBody().message).toBe('User not found');
      expect(getResponseBody().error).toBe('Not Found');
    });

    it('should handle BadRequestException', () => {
      filter.catch(new BadRequestException('Invalid input'), mockHost);

      expect(getStatusCode()).toBe(400);
      expect(getResponseBody().message).toBe('Invalid input');
    });

    it('should handle HttpException with string response', () => {
      filter.catch(new HttpException('Custom error', 422), mockHost);

      expect(getStatusCode()).toBe(422);
      expect(getResponseBody().message).toBe('Custom error');
    });

    it('should join array messages from validation errors', () => {
      filter.catch(
        new BadRequestException({
          message: ['field1 required', 'field2 invalid'],
          error: 'Bad Request',
        }),
        mockHost,
      );

      expect(getResponseBody().message).toBe('field1 required, field2 invalid');
    });
  });

  describe('Prisma error handling', () => {
    it('should map P2002 (unique constraint) to 409 Conflict', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.0.0',
        meta: { target: ['email'] },
      });

      filter.catch(error, mockHost);

      expect(getStatusCode()).toBe(HttpStatus.CONFLICT);
      expect(getResponseBody().message).toBe('A record with this email already exists');
    });

    it('should map P2025 (not found) to 404', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      });

      filter.catch(error, mockHost);

      expect(getStatusCode()).toBe(HttpStatus.NOT_FOUND);
      expect(getResponseBody().message).toBe('Record not found');
    });

    it('should map P2003 (foreign key) to 400', () => {
      const error = new Prisma.PrismaClientKnownRequestError('FK constraint', {
        code: 'P2003',
        clientVersion: '5.0.0',
        meta: { field_name: 'categoryId' },
      });

      filter.catch(error, mockHost);

      expect(getStatusCode()).toBe(HttpStatus.BAD_REQUEST);
      expect(getResponseBody().message).toBe('Invalid reference: categoryId does not exist');
    });

    it('should map P2011 (required field) to 400', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Missing field', {
        code: 'P2011',
        clientVersion: '5.0.0',
        meta: { constraint: 'name' },
      });

      filter.catch(error, mockHost);

      expect(getStatusCode()).toBe(HttpStatus.BAD_REQUEST);
      expect(getResponseBody().message).toBe('Missing required field: name');
    });

    it('should map unknown Prisma error codes to 500', () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unknown', {
        code: 'P9999',
        clientVersion: '5.0.0',
      });

      filter.catch(error, mockHost);

      expect(getStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(getResponseBody().message).toBe('A database error occurred');
    });
  });

  describe('Zod validation error handling', () => {
    it('should format Zod validation errors with field paths', () => {
      const zodError = new ZodError([
        {
          origin: 'string',
          code: 'too_small',
          minimum: 1,
          inclusive: true,
          message: 'Required',
          path: ['email'],
        },
        {
          origin: 'string',
          code: 'too_small',
          minimum: 8,
          inclusive: true,
          message: 'Too short',
          path: ['password'],
        },
      ]);
      const exception = new ZodValidationException(zodError);

      filter.catch(exception, mockHost);

      expect(getStatusCode()).toBe(400);
      expect(getResponseBody().message).toBe('email: Required, password: Too short');
      expect(getResponseBody().error).toBe('Validation Error');
    });

    it('should fall back to generic message when zodError shape is unexpected', () => {
      const exception = new ZodValidationException({} as InstanceType<typeof ZodError>);

      filter.catch(exception, mockHost);

      expect(getStatusCode()).toBe(400);
      expect(getResponseBody().message).toBe('Validation failed');
    });
  });

  describe('generic error handling', () => {
    it('should return 500 for generic Error', () => {
      filter.catch(new Error('Something broke'), mockHost);

      expect(getStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(getResponseBody().message).toBe('An unexpected error occurred');
    });

    it('should return 500 for non-Error throws', () => {
      filter.catch('string error', mockHost);

      expect(getStatusCode()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(getResponseBody().message).toBe('An unexpected error occurred');
    });
  });

  describe('logging', () => {
    it('should log error for 5xx', () => {
      filter.catch(new Error('Server crash'), mockHost);

      expect(filter['logger'].error).toHaveBeenCalled();
    });

    it('should log warn for 4xx', () => {
      filter.catch(new NotFoundException('Not found'), mockHost);

      expect(filter['logger'].warn).toHaveBeenCalled();
    });
  });
});
