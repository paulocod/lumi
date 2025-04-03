import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from '../../presentation/pdf/pdf.controller';
import { LoggerService } from '../../config/logger';
import { PdfCacheService } from './services/pdf-cache.service';
import { PdfValidationService } from './services/pdf-validation.service';
import { PdfLayoutService } from './services/pdf-layout.service';
import { RedisCacheModule } from '../../config/cache.module';

@Module({
  imports: [RedisCacheModule],
  controllers: [PdfController],
  providers: [
    PdfService,
    LoggerService,
    PdfCacheService,
    PdfValidationService,
    PdfLayoutService,
  ],
  exports: [PdfService],
})
export class PdfModule {}
