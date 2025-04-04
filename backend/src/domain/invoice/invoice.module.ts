import { Module } from '@nestjs/common';
import { InvoiceController } from '@/presentation/invoice/invoice.controller';
import { PdfModule } from '../pdf/pdf.module';
import { InvoiceSharedModule } from '@/shared/invoice-shared.module';
import { PrismaModule } from 'prisma/prisma.module';
import { LoggerModule } from '@/config/logger';

@Module({
  imports: [PdfModule, PrismaModule, InvoiceSharedModule, LoggerModule],
  controllers: [InvoiceController],
  exports: [],
})
export class InvoiceModule {}
