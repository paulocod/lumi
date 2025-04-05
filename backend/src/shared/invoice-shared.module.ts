import { Module } from '@nestjs/common';
import { InvoiceService } from '@/modules/invoice/services/invoice.service';
import { PdfModule } from '@/modules/pdf/pdf.module';
import { InvoiceQueueModule } from '@/queue/queue.module';
import { RepositoriesModule } from '@/infrastructure/database/prisma/repositories/repositories.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule, PdfModule, InvoiceQueueModule, RepositoriesModule],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceSharedModule {}
