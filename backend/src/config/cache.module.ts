import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      ttl: 60 * 60 * 24,
      max: 1000,
      prefix: 'pdf:',
      database: 0,
      password: process.env.REDIS_PASSWORD,
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
