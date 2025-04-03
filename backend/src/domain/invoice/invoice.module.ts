import { Module } from '@nestjs/common';
import { InvoiceController } from '../../presentation/invoice/invoice.controller';
import { InvoiceService } from '../../application/invoice/invoice.service';
import { PrismaInvoiceRepository } from '../../infrastructure/repositories/prisma/invoice.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { INVOICE_REPOSITORY } from './invoice.tokens';

@Module({
  imports: [PrismaModule],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    {
      provide: INVOICE_REPOSITORY,
      useClass: PrismaInvoiceRepository,
    },
  ],
  exports: [InvoiceService],
})
export class InvoiceModule {}
