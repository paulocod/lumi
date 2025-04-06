import { Module, OnModuleInit } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { LoggerModule } from '@/config/logger';
import { InvoiceController } from './controllers/invoice.controller';
import { PdfModule } from '@/modules/pdf/pdf.module';
import { InvoiceService } from './services/invoice.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PdfLayoutService } from '../pdf/services/layout/pdf-layout.service';
import { layouts } from './layouts';
import { RepositoriesModule } from '@/infrastructure/database/prisma/repositories/repositories.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    PdfModule,
    PrismaModule,
    LoggerModule,
    RepositoriesModule,
    EventEmitterModule.forRoot(),
    BullModule.registerQueue({
      name: 'invoice-processing',
    }),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule implements OnModuleInit {
  constructor(private readonly pdfLayoutService: PdfLayoutService) {}

  onModuleInit() {
    this.pdfLayoutService.registerLayout(layouts.CEMIG);
  }
}
