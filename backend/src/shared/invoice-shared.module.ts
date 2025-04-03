import { Module } from '@nestjs/common';
import { InvoiceService } from '@/application/services/invoice.service';
import { PdfModule } from '@/domain/pdf/pdf.module';
import { InvoiceQueueModule } from '@/application/queues/invoice-queue.module';
import { RepositoriesModule } from '@/infrastructure/repositories/repositories.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule, PdfModule, InvoiceQueueModule, RepositoriesModule],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceSharedModule {}
