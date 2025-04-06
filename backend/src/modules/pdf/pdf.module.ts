import { Module } from '@nestjs/common';
import { PdfService } from './services/pdf.service';
import { PdfCacheService } from './services/cache/pdf-cache.service';
import { PdfStorageService } from './services/storage/pdf-storage.service';
import { PdfLayoutService } from './services/layout/pdf-layout.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerService } from '@/config/logger';
import { PdfValidationService } from './services/validation/pdf-validation.service';
import { MinioClientProvider } from './providers/minio-client.provider';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        url: configService.get<string>('redis.url'),
        ttl: configService.get<number>('cache.ttl'),
        max: configService.get<number>('cache.max'),
        prefix: configService.get<string>('cache.prefix'),
        database: 0,
        password: configService.get<string>('redis.password'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    PdfService,
    PdfCacheService,
    PdfStorageService,
    PdfLayoutService,
    LoggerService,
    PdfValidationService,
    MinioClientProvider,
  ],
  exports: [PdfService, PdfStorageService, PdfLayoutService],
})
export class PdfModule {}
