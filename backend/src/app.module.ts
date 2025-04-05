import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './config/logger';
import { RedisCacheModule } from './config/cache.module';
import { InvoiceModule } from './domain/invoice/invoice.module';
import { PdfModule } from './domain/pdf/pdf.module';
import { InvoiceQueueModule } from './application/queues/invoice-queue.module';
import { BullConfigModule } from './config/bull.module';
import { InvoiceSharedModule } from './shared/invoice-shared.module';
import { AuthModule } from './domain/auth/auth.module';
import { RolesGuard } from './domain/auth/guards/roles.guard';
import { appConfig, pdfConfig, queueConfig } from './config/app.config';
import { PrismaModule } from 'prisma/prisma.module';
import { DashboardModule } from './presentation/dashboard/dashboard.module';
import { TracingModule } from './config/tracing/tracing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, pdfConfig, queueConfig],
      cache: true,
      expandVariables: true,
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      newListener: true,
      removeListener: true,
      maxListeners: 10,
      verboseMemoryLeak: true,
    }),
    BullConfigModule,
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: configService.get<number>('app.rateLimit.ttl') || 60,
            limit: configService.get<number>('app.rateLimit.limit') || 10,
          },
        ],
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    LoggerModule,
    RedisCacheModule,
    HealthModule,
    PdfModule,
    DashboardModule,
    InvoiceSharedModule,
    InvoiceModule,
    InvoiceQueueModule,
    AuthModule,
    TracingModule,
  ],
  providers: [RolesGuard],
})
export class AppModule {}
