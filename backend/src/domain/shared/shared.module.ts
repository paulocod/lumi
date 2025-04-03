import { Module } from '@nestjs/common';
import { PdfService } from '../pdf/pdf.service';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  providers: [PdfService],
  exports: [PdfService],
})
export class SharedModule {}
