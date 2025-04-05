import { PdfModule } from '@/modules/pdf/pdf.module';
import { PdfService } from '@/modules/pdf/services/pdf.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [PdfModule],
  providers: [PdfService],
  exports: [PdfService],
})
export class SharedModule {}
