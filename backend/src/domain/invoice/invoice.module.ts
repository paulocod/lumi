import { Module } from '@nestjs/common';
import { InvoiceController } from '@/presentation/invoice/invoice.controller';
import { PdfModule } from '../pdf/pdf.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { InvoiceSharedModule } from '@/shared/invoice-shared.module';

@Module({
  imports: [PdfModule, PrismaModule, InvoiceSharedModule],
  controllers: [InvoiceController],
  exports: [],
})
export class InvoiceModule {}
