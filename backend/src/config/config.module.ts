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
      ],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
