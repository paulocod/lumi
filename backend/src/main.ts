import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { createTracingConfig } from './config/tracing/tracing.config';
import { setupSwagger } from './config/swagger.config';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    logger.log('Iniciando aplicação...');

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      bufferLogs: true,
    });

    const configService = app.get(ConfigService);

    logger.log('Configurando middleware e pipes...');

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

    logger.log('Iniciando OpenTelemetry...');

    try {
      const otelSDK = createTracingConfig(configService);
      otelSDK.start();
      logger.log('OpenTelemetry SDK iniciado com sucesso');
    } catch (error) {
      logger.error('Erro ao iniciar OpenTelemetry SDK', error);
    }

    const port = configService.get<number>('app.port') ?? 3001;

    logger.log(`Iniciando servidor na porta ${port}...`);
    await app.listen(port);

    logger.log(
      'Aplicação rodando em: ' +
        `http://localhost:${port}\n` +
        'Documentação Swagger disponível em: ' +
        `http://localhost:${port}/api`,
    );
  } catch (error) {
    logger.error('Erro fatal ao iniciar a aplicação:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Erro não tratado durante o bootstrap:', error);
  process.exit(1);
});
