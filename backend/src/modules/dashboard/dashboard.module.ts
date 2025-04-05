import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { RepositoriesModule } from '@/infrastructure/database/prisma/repositories/repositories.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DashboardService } from './services/dashboard.service';

@Module({
  imports: [
    RepositoriesModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        url: configService.get('redis.url'),
        ttl: configService.get('cache.ttl'),
        max: configService.get('cache.max'),
        prefix: 'dashboard:',
        database: 0,
        password: configService.get('redis.password'),
      }),
    }),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
