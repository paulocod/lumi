import { Module } from '@nestjs/common';
import { InvoiceService } from '@/application/services/invoice.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { PdfModule } from '@/domain/pdf/pdf.module';
import { InvoiceQueueModule } from '@/application/queues/invoice-queue.module';
import { RepositoriesModule } from '@/infrastructure/repositories/repositories.module';

@Module({
  imports: [PrismaModule, PdfModule, InvoiceQueueModule, RepositoriesModule],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceSharedModule {}
