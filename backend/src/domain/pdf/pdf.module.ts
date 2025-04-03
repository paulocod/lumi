import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from '../../presentation/pdf/pdf.controller';
import { LoggerService } from '../../config/logger.service';

@Module({
  controllers: [PdfController],
  providers: [PdfService, LoggerService],
  exports: [PdfService],
})
export class PdfModule {}
