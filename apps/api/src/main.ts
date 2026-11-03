import { ValidationPipe, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';

  app.getHttpAdapter().getInstance().disable('x-powered-by');
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
  app.use((request: { method: string; originalUrl: string; headers: Record<string,string | string[] | undefined>; requestId?: string }, response: {
    setHeader: (key: string, value: string) => void;
    on: (event: string, cb: () => void) => void;
    statusCode: number;
  }, next: () => void) => {
    const supplied = request.headers['x-request-id'];
    const requestId = typeof supplied === 'string' && /^[a-zA-Z0-9_.-]{8,96}$/.test(supplied)
      ? supplied : randomUUID();
    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);
    const started = Date.now();
    response.on('finish', () => {
      requestLogger.log(JSON.stringify({
        event: 'http_request',
        requestId, method: request.method,
        path: request.originalUrl?.split('?')[0],
        status: response.statusCode,
        durationMs: Date.now() - started,
      }));
    });
    next();
  });
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

  const swaggerEnabled =
    !isProduction || config.get<string>('SWAGGER_ENABLED', 'false') === 'true';

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AdminGest API')
      .setDescription(
        'API multiempresa para CRM, proyectos y gestión administrativa.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    SwaggerModule.setup(
      'docs',
      app,
      SwaggerModule.createDocument(app, swaggerConfig),
      {
        swaggerOptions: { persistAuthorization: false },
      },
    );
  }

  await app.listen(config.get<number>('PORT', 3000), '0.0.0.0');
}

void bootstrap();
