import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  const rawCorsOrigin = process.env.CORS_ORIGIN?.trim();
  const corsOrigin = !rawCorsOrigin
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : rawCorsOrigin === '*'
      ? true
      : rawCorsOrigin
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean);

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('VERSSARO Luxury Streetwear API')
    .setDescription(
      'REST API for VERSSARO Storefront, Client Dossier, NFC Provenance Vault, and Atelier HQ Admin Console',
    )
    .setVersion('2.4')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
