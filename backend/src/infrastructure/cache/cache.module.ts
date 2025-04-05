import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        url: configService.get('redis.url'),
        ttl: configService.get('cache.ttl'),
        max: configService.get('cache.max'),
        prefix: configService.get('cache.prefix'),
        database: 0,
        password: configService.get('redis.password'),
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
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
