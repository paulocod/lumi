import { Module } from '@nestjs/common';
import { PrismaInvoiceRepository } from './prisma/invoice.repository';
import { INVOICE_REPOSITORY } from '@/domain/invoice/invoice.tokens';
import { PrismaModule } from 'prisma/prisma.module';

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
