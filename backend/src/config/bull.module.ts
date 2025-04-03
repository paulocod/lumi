import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
      prefix: 'lumi',
      limiter: {
        max: 100,
        duration: 1000,
      },
    }),
  ],
  exports: [BullModule],
})
export class BullConfigModule {}
