import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { InvoiceQueueProcessor } from './invoice-queue.processor';
import { InvoiceQueueController } from './invoice-queue.controller';
import { PdfModule } from '@/domain/pdf/pdf.module';
import { PrismaModule } from 'prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '@/config/logger';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: 'invoice-processing',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
        },
        redis: configService.get<string>('redis.url'),
        limiter: {
          max: 5,
          duration: 1000,
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    PdfModule,
    LoggerModule,
  ],
  providers: [InvoiceQueueProcessor],
  controllers: [InvoiceQueueController],
})
export class InvoiceQueueModule {}
