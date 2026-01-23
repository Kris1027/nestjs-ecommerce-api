import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpAdapter = this.httpAdapterHost.httpAdapter;

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    const httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception);

    const error = this.extractErrorName(exception, httpStatus);

    const responseBody: ErrorResponse = {
      success: false,
      statusCode: httpStatus,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logError(exception, responseBody);

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null) {
        const responseObj = response as Record<string, unknown>;
        if (Array.isArray(responseObj.message)) {
          return responseObj.message.join(', ');
        }
        if (typeof responseObj.message === 'string') {
          return responseObj.message;
        }
      }
      if (typeof response === 'string') {
        return response;
      }
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'An unexpected error occurred';
  }

  private extractErrorName(exception: unknown, statusCode: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const responseObj = response as Record<string, unknown>;
        if (typeof responseObj.error === 'string') {
          return responseObj.error;
        }
      }
    }
    return HttpStatus[statusCode] ?? 'INTERNAL_SERVER_ERROR';
  }

  private logError(exception: unknown, response: ErrorResponse): void {
    if (response.statusCode >= 500) {
      console.error(
        `[${response.timestamp}] ${response.error} at ${response.path}:`,
        exception instanceof Error ? exception.stack : exception,
      );
    } else {
      console.warn(
        `[${response.timestamp}] ${response.statusCode} ${response.error} at ${response.path}:
  ${response.message}`,
      );
    }
  }
}
