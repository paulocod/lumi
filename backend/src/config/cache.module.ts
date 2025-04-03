import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      ttl: 60 * 60 * 24,
      max: 1000,
      prefix: 'pdf:',
      database: 0,
      password: process.env.REDIS_PASSWORD,
      serializer: {
        serialize: (value: unknown): string => {
          if (typeof value === 'string') {
            return value;
          }
          return JSON.stringify(value);
        },
        deserialize: (value: string): unknown => {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        },
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
