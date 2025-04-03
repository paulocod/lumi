/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from '../invoice/dto/create-invoice.dto';
import { LoggerService } from '../../config/logger.service';
import { PdfCacheService } from './services/pdf-cache.service';
import { PdfValidationService } from './services/pdf-validation.service';
import { PdfLayoutService } from './services/pdf-layout.service';
import { PdfExtractionError } from './types/pdf-extraction.types';
import * as pdf from 'pdf-parse';

interface PdfData {
  text: string;
  numpages: number;
  info: any;
}

@Injectable()
export class PdfService {
  constructor(
    private readonly logger: LoggerService,
    private readonly cacheService: PdfCacheService,
    private readonly validationService: PdfValidationService,
    private readonly layoutService: PdfLayoutService,
  ) {}

  async extractInvoiceFromPdf(buffer: Buffer): Promise<CreateInvoiceDto> {
    try {
      const cached = await this.cacheService.getCachedResult(buffer);
      if (cached) {
        return cached.result;
      }

      const data = (await pdf(buffer)) as PdfData;
      const text = data.text;

      const layouts = this.layoutService.getLayouts();
      let extractedData: Partial<CreateInvoiceDto> | null = null;
      let errors: string[] = [];

      for (const layout of layouts) {
        try {
          extractedData = await layout.extract(text);
          const validation =
            this.validationService.validateExtractedData(extractedData);

          if (validation.isValid && validation.data) {
            const confidence = [
              {
                field: 'clientNumber',
                value: validation.data.clientNumber,
                confidence: 1,
                method: 'regex',
              },
              {
                field: 'referenceMonth',
                value: validation.data.referenceMonth.toISOString(),
                confidence: 1,
                method: 'regex',
              },
            ];

            await this.cacheService.setCachedResult(
              buffer,
              validation.data,
              confidence,
            );

            return validation.data;
          }

          errors = errors.concat(validation.errors);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(
            `Falha ao extrair dados usando layout ${layout.name}: ${errorMessage}`,
            'PdfService',
          );
          errors.push(errorMessage);
        }
      }

      throw new PdfExtractionError(
        errors.map((message) => ({
          code: 'EXTRACTION_FAILED',
          message,
        })),
        extractedData || undefined,
      );
    } catch (error) {
      if (error instanceof PdfExtractionError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Erro ao extrair dados do PDF: ${errorMessage}`,
        'PdfService',
      );
      throw new PdfExtractionError([
        {
          code: 'PDF_PROCESSING_ERROR',
          message: 'Erro ao processar o arquivo PDF',
        },
      ]);
    }
  }
}
