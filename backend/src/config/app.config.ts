import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  environment: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origin: process.env.CORS_ORIGIN || '*',
  },
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_MAX || '10', 10),
  },
}));

export const pdfConfig = registerAs('pdf', () => ({
  downloadTimeout: parseInt(process.env.PDF_DOWNLOAD_TIMEOUT || '30000', 10),
  maxSize: parseInt(process.env.PDF_MAX_SIZE || '5242880', 10), // 5MB
  allowedTypes: ['application/pdf'],
  cache: {
    ttl: parseInt(process.env.PDF_CACHE_TTL || '3600', 10), // 1 hour
  },
}));

export const queueConfig = registerAs('queue', () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
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
