import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = this.buildPayload(exception, status);

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      ...payload,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }

  private buildPayload(exception: unknown, status: number): ErrorResponse {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: status,
        message: 'Ocurrió un error interno. Inténtalo nuevamente.',
        error: 'Internal Server Error',
      };
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return { statusCode: status, message: response };
    }

    const objectResponse = response as Partial<ErrorResponse>;
    return {
      statusCode: status,
      message: objectResponse.message ?? exception.message,
      error: objectResponse.error,
    };
  }
}
