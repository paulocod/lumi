import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  cacheConfig,
  pdfConfig,
  queueConfig,
  tracingConfig,
  minioConfig,
} from './app.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        cacheConfig,
        pdfConfig,
        queueConfig,
        tracingConfig,
        minioConfig,
      ],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
