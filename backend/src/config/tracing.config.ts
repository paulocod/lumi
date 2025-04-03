import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import * as winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});

const resource = resourceFromAttributes({
  'service.name': 'lumi-backend',
  'service.version': '1.0.0',
});

export const otelSDK = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({
    url: process.env.JAEGER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    headers: {
      'Content-Type': 'application/json',
    },
  }),
  instrumentations: [
    getNodeAutoInstrumentations(),
    new NestInstrumentation(),
    new HttpInstrumentation(),
  ],
});

process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(() => logger.info('Tracing terminated'))
    .catch((error) => logger.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
