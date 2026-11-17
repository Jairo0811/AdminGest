import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

    const mapped = mapPrismaError(exception);
    const status = mapped
      ? mapped.statusCode
      : exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = mapped ?? this.buildPayload(exception, status);

    if (mapped) {
      this.logger.warn(
        `${request.method} ${request.originalUrl?.split('?')[0]} -> ${mapped.statusCode} (${(exception as { code?: string }).code ?? 'prisma'})`,
      );
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      requestId: (request as Request & { requestId?: string }).requestId,
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

/**
 * Translates known Prisma errors into safe HTTP responses so constraint violations do
 * not surface as 500 errors nor leak table or constraint names to the client.
 */
export function mapPrismaError(exception: unknown): ErrorResponse | null {
  if (!(exception instanceof Prisma.PrismaClientKnownRequestError)) return null;
  switch (exception.code) {
    case 'P2002':
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Ya existe un registro con esos datos únicos.',
        error: 'Conflict',
      };
    case 'P2003':
    case 'P2014':
      return {
        statusCode: HttpStatus.CONFLICT,
        message:
          'La operación no es posible porque el registro tiene información relacionada o hace referencia a datos no válidos.',
        error: 'Conflict',
      };
    case 'P2025':
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'El registro solicitado no existe.',
        error: 'Not Found',
      };
    case 'P2034':
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'La operación entró en conflicto con otra solicitud. Inténtalo nuevamente.',
        error: 'Conflict',
      };
    case 'P2010':
      if (String(exception.message).includes('51001')) {
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'El recurso está ocupado por otra solicitud. Inténtalo nuevamente.',
          error: 'Service Unavailable',
        };
      }
      return null;
    default:
      return null;
  }
}
