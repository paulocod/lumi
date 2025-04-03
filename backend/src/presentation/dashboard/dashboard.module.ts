import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PrismaInvoiceRepository } from '../../infrastructure/repositories/prisma/invoice.repository';
import { INVOICE_REPOSITORY } from '../../domain/invoice/invoice.tokens';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    {
      provide: INVOICE_REPOSITORY,
      useClass: PrismaInvoiceRepository,
    },
  ],
})
export class DashboardModule {}
