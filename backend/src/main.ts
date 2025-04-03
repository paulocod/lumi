import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { otelSDK } from './config/tracing.config';

async function bootstrap() {
  otelSDK.start();

  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const config = new DocumentBuilder()
    .setTitle('Lumi API')
    .setDescription('API para gerenciamento de faturas de energia')
    .setVersion('1.0')
    .addTag('Lumi')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.use(helmet());
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(
    'Aplicação rodando em: ' +
      `http://localhost:${port}\n` +
      'Documentação Swagger disponível em: ' +
      `http://localhost:${port}/api`,
  );
}

void bootstrap();
