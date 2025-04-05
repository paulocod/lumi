import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { createTracingConfig } from './config/tracing/tracing.config';
import { setupSwagger } from './config/swagger.config';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  try {
    const otelSDK = createTracingConfig(configService);
    otelSDK.start();
    logger.log('OpenTelemetry SDK iniciado com sucesso');
  } catch (error) {
    logger.error('Erro ao iniciar OpenTelemetry SDK', error);
  }

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  setupSwagger(app);

  app.use(helmet());
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = configService.get<number>('app.port') ?? 3001;
  await app.listen(port);

  logger.log(
    'Aplicação rodando em: ' +
      `http://localhost:${port}\n` +
      'Documentação Swagger disponível em: ' +
      `http://localhost:${port}/api`,
  );
}

void bootstrap();
