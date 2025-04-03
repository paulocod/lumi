import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { PrismaInvoiceRepository } from './prisma/invoice.repository';
import { INVOICE_REPOSITORY } from '@/domain/invoice/invoice.tokens';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: INVOICE_REPOSITORY,
      useClass: PrismaInvoiceRepository,
    },
  ],
  exports: [INVOICE_REPOSITORY],
})
export class RepositoriesModule {}
