import { Module } from '@nestjs/common';
import { PdfService } from './services/pdf.service';
import { LoggerService } from '../../config/logger';
import { PdfValidationService } from './services/validation/pdf-validation.service';
import { PdfLayoutService } from './services/layout/pdf-layout.service';
import { RedisCacheModule } from '../../infrastructure/cache/cache.module';
import { PdfCacheService } from './services/cache/pdf-cache.service';

@Module({
  imports: [RedisCacheModule],
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
