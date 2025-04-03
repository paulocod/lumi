import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import * as winston from 'winston';

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

export const otelSDK = new NodeSDK({
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(
      () => logger.info('SDK desligado com sucesso'),
      (err) => logger.error('Erro ao desligar SDK:', err),
    )
    .finally(() => process.exit(0));
});
