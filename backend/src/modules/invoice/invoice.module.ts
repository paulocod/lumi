import { Module } from '@nestjs/common';
import { InvoiceSharedModule } from '@/shared/invoice-shared.module';
import { PrismaModule } from 'prisma/prisma.module';
import { LoggerModule } from '@/config/logger';
import { InvoiceController } from './controllers/invoice.controller';
import { PdfModule } from '@/modules/pdf/pdf.module';

@Module({
  imports: [PdfModule, PrismaModule, InvoiceSharedModule, LoggerModule],
  controllers: [InvoiceController],
  exports: [],
})
export class InvoiceModule {}
