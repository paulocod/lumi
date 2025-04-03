import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { InvoiceQueueProcessor } from './invoice-queue.processor';
import { InvoiceQueueController } from './invoice-queue.controller';
import { PdfModule } from '@/domain/pdf/pdf.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'invoice-processing',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      },
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
      limiter: {
        max: 5,
        duration: 1000,
      },
    }),
    PrismaModule,
    PdfModule,
  ],
  providers: [InvoiceQueueProcessor],
  controllers: [InvoiceQueueController],
})
export class InvoiceQueueModule {}
