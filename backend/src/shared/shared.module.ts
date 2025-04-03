import { PdfModule } from '@/domain/pdf/pdf.module';
import { PdfService } from '@/domain/pdf/pdf.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [PdfModule],
  providers: [PdfService],
  exports: [PdfService],
})
export class SharedModule {}
