import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { PrismaInstrumentation } from '@prisma/instrumentation';

export const createTracingConfig = (configService: ConfigService) => {
  const logger = new Logger('Tracing');

  const otlpUrl = configService.get<string>('tracing.jaeger.endpoint');

  const resource = resourceFromAttributes({
    'service.name': configService.get<string>('tracing.service.name'),
    'service.version': configService.get<string>('tracing.service.version'),
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      url: otlpUrl,
    }),
    instrumentations: [
      getNodeAutoInstrumentations(),
      new NestInstrumentation(),
      new HttpInstrumentation(),
      new PrismaInstrumentation(),
    ],
  });

  process.on('SIGTERM', () => {
    void sdk
      .shutdown()
      .then(() => logger.log('Tracing terminated'))
      .catch((error) => logger.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  return sdk;
};
