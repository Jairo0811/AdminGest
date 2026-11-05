import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { API_VERSION } from './version';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  configureApp(app);
  const config = app.get(ConfigService);
  const isProduction = config.get<string>('NODE_ENV', 'development') === 'production';

  const swaggerEnabled =
    !isProduction || config.get<string>('SWAGGER_ENABLED', 'false') === 'true';

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AdminGest API')
      .setDescription(
        'API multiempresa para CRM, proyectos y gestión administrativa.',
      )
      .setVersion(API_VERSION)
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
