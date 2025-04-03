import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './config/logger.module';
import { RedisCacheModule } from './config/cache.module';
import { InvoiceModule } from './domain/invoice/invoice.module';
import { PdfModule } from './domain/pdf/pdf.module';
import { DashboardModule } from './domain/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 10,
      },
    ]),
    LoggerModule,
    RedisCacheModule,
    PrismaModule,
    HealthModule,
    InvoiceModule,
    PdfModule,
    DashboardModule,
  ],
})
export class AppModule {}
