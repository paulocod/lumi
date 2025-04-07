import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  environment: process.env.NODE_ENV || 'development',
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origin: process.env.CORS_ORIGIN || '*',
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_MAX || '10', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiration: process.env.JWT_EXPIRATION || '1d',
  },
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
}));

export const cacheConfig = registerAs('cache', () => ({
  ttl: parseInt(process.env.CACHE_TTL || '86400', 10),
  max: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
  prefix: process.env.CACHE_PREFIX || 'cache:',
}));

export const pdfConfig = registerAs('pdf', () => ({
  downloadTimeout: parseInt(process.env.PDF_DOWNLOAD_TIMEOUT || '30000', 10),
  maxSize: parseInt(process.env.PDF_MAX_SIZE || '5242880', 10),
  allowedTypes: ['application/pdf'],
  cache: {
    ttl: parseInt(process.env.PDF_CACHE_TTL || '3600', 10),
  },
}));

export const queueConfig = registerAs('queue', () => ({
  redis: {
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  defaultJobOptions: {
    attempts: parseInt(process.env.QUEUE_MAX_ATTEMPTS || '3', 10),
    backoff: {
      type: 'exponential',
      delay: parseInt(process.env.QUEUE_BACKOFF_DELAY || '1000', 10),
    },
    removeOnComplete: true,
  },
  limiter: {
    max: parseInt(process.env.QUEUE_LIMITER_MAX || '5', 10),
    duration: parseInt(process.env.QUEUE_LIMITER_DURATION || '1000', 10),
  },
}));

export const tracingConfig = registerAs('tracing', () => ({
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  service: {
    name: process.env.OTEL_SERVICE_NAME || 'lumi-backend',
    version: process.env.OTEL_SERVICE_VERSION || '1.0.0',
  },
  jaeger: {
    endpoint:
      process.env.JAEGER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  },
}));

export const minioConfig = registerAs('minio', () => ({
  endpoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  processBucket: process.env.MINIO_PROCESS_BUCKET || 'lumi-process-invoices',
  processedBucket:
    process.env.MINIO_PROCESSED_BUCKET || 'lumi-processed-invoices',
}));
