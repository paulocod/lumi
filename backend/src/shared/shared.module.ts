import { PdfModule } from '@/modules/pdf/pdf.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [PdfModule],
  exports: [PdfModule],
})
export class SharedModule {}
