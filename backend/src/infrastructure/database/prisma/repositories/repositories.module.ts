import { Module } from '@nestjs/common';
import { PrismaInvoiceRepository } from '../../../../modules/invoice/repositories/invoice.repository';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: PrismaInvoiceRepository,
      useClass: PrismaInvoiceRepository,
    },
  ],
  exports: [PrismaInvoiceRepository],
})
export class RepositoriesModule {}
