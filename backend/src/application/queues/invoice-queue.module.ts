import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { InvoiceQueueProcessor } from './invoice-queue.processor';
import { InvoiceQueueController } from './invoice-queue.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { PdfModule } from '@/domain/pdf/pdf.module';

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
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
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
