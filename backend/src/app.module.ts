/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './config/logger.module';
import { RedisCacheModule } from './config/cache.module';
import { InvoiceModule } from './domain/invoice/invoice.module';
import { PdfModule } from './domain/pdf/pdf.module';
import { DashboardModule } from './domain/dashboard/dashboard.module';
import { InvoiceQueueModule } from './application/queues/invoice-queue.module';
import { BullConfigModule } from './config/bull.module';
import { InvoiceSharedModule } from './shared/invoice-shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    EventEmitterModule.forRoot(),
    BullConfigModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
    PrismaModule,
    LoggerModule,
    RedisCacheModule,
    HealthModule,
    PdfModule,
    DashboardModule,
    InvoiceSharedModule,
    InvoiceModule,
    InvoiceQueueModule,
  ],
})
export class AppModule {}
