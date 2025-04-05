import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('redis.url'),
        defaultJobOptions: configService.get('queue.defaultJobOptions'),
        prefix: 'lumi',
        limiter: configService.get('queue.limiter'),
      }),
    }),
  ],
  exports: [BullModule],
})
export class BullConfigModule {}
