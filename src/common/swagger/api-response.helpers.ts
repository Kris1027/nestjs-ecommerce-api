import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponseSchema, PaginationMeta } from './api-response.schema';

// Wraps a DTO in the success envelope: { success, data: T, timestamp }
export function ApiSuccessResponse(
  dataDto: Type,
  statusCode = 200,
  description = 'Success',
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(dataDto),
    ApiResponse({
      status: statusCode,
      description,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: getSchemaPath(dataDto) },
          timestamp: { type: 'string', example: '2025-01-15T12:00:00.000Z' },
        },
        required: ['success', 'data', 'timestamp'],
      },
    }),
  );
}

// Wraps an array DTO in the paginated envelope: { success, data: T[], meta, timestamp }
export function ApiPaginatedResponse(
  dataDto: Type,
  description = 'Paginated list',
): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(dataDto, PaginationMeta),
    ApiResponse({
      status: 200,
      description,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(dataDto) },
          },
          meta: { $ref: getSchemaPath(PaginationMeta) },
          timestamp: { type: 'string', example: '2025-01-15T12:00:00.000Z' },
        },
        required: ['success', 'data', 'meta', 'timestamp'],
      },
    }),
  );
}

// Wraps an array DTO in the success envelope WITHOUT pagination meta: { success, data: T[], timestamp }
export function ApiSuccessListResponse(dataDto: Type, description = 'List'): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(dataDto),
    ApiResponse({
      status: 200,
      description,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(dataDto) },
          },
          timestamp: { type: 'string', example: '2025-01-15T12:00:00.000Z' },
        },
        required: ['success', 'data', 'timestamp'],
      },
    }),
  );
}

// Adds standard error response schemas for given HTTP status codes
export function ApiErrorResponses(...codes: number[]): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ErrorResponseSchema),
    ...codes.map((code) =>
      ApiResponse({
        status: code,
        description: errorDescription(code),
        schema: { $ref: getSchemaPath(ErrorResponseSchema) },
      }),
    ),
  );
}

function errorDescription(code: number): string {
  const descriptions: Record<number, string> = {
    400: 'Bad Request / Validation Error',
    401: 'Unauthorized — Missing or invalid JWT',
    403: 'Forbidden — Insufficient role',
    404: 'Resource not found',
    409: 'Conflict — Duplicate resource',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests — Rate limit exceeded',
    500: 'Internal Server Error',
  };
  return descriptions[code] ?? 'Error';
}
