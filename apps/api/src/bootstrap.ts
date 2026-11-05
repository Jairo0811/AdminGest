import { Logger, ValidationPipe } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

/**
 * HTTP configuration shared by the production server and the integration tests, so that
 * the tests exercise exactly the same prefix, CORS, security headers, validation and
 * error handling.
 */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';

  app.getHttpAdapter().getInstance().disable('x-powered-by');
  // Behind an HTTPS reverse proxy, request.ip, throttling and audit IPs must come from
  // X-Forwarded-For of the trusted proxy only (see docs/DEPLOYMENT.md).
  const trustProxy = config.get<string>('TRUST_PROXY', '').trim();
  if (trustProxy && trustProxy !== 'false') {
    app.set(
      'trust proxy',
      /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy === 'true' ? true : trustProxy,
    );
  }
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'no-referrer' },
      strictTransportSecurity: isProduction
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,
    }),
  );
  const requestLogger = new Logger('HttpRequest');
  app.use(
    (
      request: {
        method: string;
        originalUrl: string;
        headers: Record<string, string | string[] | undefined>;
        requestId?: string;
      },
      response: {
        setHeader: (key: string, value: string) => void;
        on: (event: string, cb: () => void) => void;
        statusCode: number;
      },
      next: () => void,
    ) => {
      const supplied = request.headers['x-request-id'];
      const requestId =
        typeof supplied === 'string' && /^[a-zA-Z0-9_.-]{8,96}$/.test(supplied)
          ? supplied
          : randomUUID();
      request.requestId = requestId;
      response.setHeader('X-Request-Id', requestId);
      const started = Date.now();
      response.on('finish', () => {
        requestLogger.log(
          JSON.stringify({
            event: 'http_request',
            requestId,
            method: request.method,
            path: request.originalUrl?.split('?')[0],
            status: response.statusCode,
            durationMs: Date.now() - started,
          }),
        );
      });
      next();
    },
  );
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config
      .get<string>('CORS_ORIGIN', 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86_400,
  });
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      stopAtFirstError: false,
    }),
  );
}
