import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HealthModule } from './modules/health/health.module';
import { LoggerModule } from './config/logger';
import { RedisCacheModule } from './infrastructure/cache/cache.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { InvoiceQueueModule } from './queue/queue.module';
import { BullConfigModule } from './queue/infrastructure/bull.module';
import { InvoiceSharedModule } from './shared/invoice-shared.module';
import { RolesGuard } from './shared/guards/roles.guard';
import { appConfig, pdfConfig, queueConfig } from './config/app.config';
import { PrismaModule } from 'prisma/prisma.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { TracingModule } from './config/tracing/tracing.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { AuthModule } from './modules/auth/auth.module';

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
