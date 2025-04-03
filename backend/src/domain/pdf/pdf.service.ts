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
  private readonly monthMap: { [key: string]: number } = {
    JAN: 0,
    FEV: 1,
    MAR: 2,
    ABR: 3,
    MAI: 4,
    JUN: 5,
    JUL: 6,
    AGO: 7,
    SET: 8,
    OUT: 9,
    NOV: 10,
    DEZ: 11,
    JANEIRO: 0,
    FEVEREIRO: 1,
    MARÇO: 2,
    ABRIL: 3,
    MAIO: 4,
    JUNHO: 5,
    JULHO: 6,
    AGOSTO: 7,
    SETEMBRO: 8,
    OUTUBRO: 9,
    NOVEMBRO: 10,
    DEZEMBRO: 11,
  };

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

      // Tentar extrair dados usando os layouts disponíveis
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

  private processExtractedData(
    text: string,
    clientNumber: string,
    referenceMonth: Date,
  ): CreateInvoiceDto {
    const electricityMatch = text.match(
      /Energia\s+Elétrica\s+(?:kWh|consumo)?\s*(\d+)\s*(?:kWh)?\s*([\d,.]+)/i,
    );
    let electricityQuantity = 0;
    let electricityValue = 0;

    if (electricityMatch) {
      electricityQuantity = parseInt(electricityMatch[1]);
      electricityValue = parseFloat(
        electricityMatch[2].replace('.', '').replace(',', '.'),
      );
    } else {
      this.logger.warn(
        'Electricity values not found in PDF, setting to zero',
        'PdfService',
      );
    }

    let sceeMatch = text.match(
      /Energia\s+SCEE\s+(?:s\/\s*ICMS)?\s*(?:kWh)?\s*(\d+)\s*(?:kWh)?\s*([\d,.]+)/i,
    );
    if (!sceeMatch) {
      sceeMatch = text.match(
        /(?:Energia|Geração)\s+(?:SCEE|Própria)\s*(\d+)\s*(?:kWh)?\s*([\d,.]+)/i,
      );
    }
    if (!sceeMatch) {
      throw new Error('SCEE values not found in PDF');
    }
    const sceeQuantity = parseInt(sceeMatch[1]);
    const sceeValue = parseFloat(
      sceeMatch[2].replace('.', '').replace(',', '.'),
    );

    let compensatedMatch = text.match(
      /Energia\s+compensada\s+(?:GD\s+I)?\s*(?:kWh)?\s*(\d+)\s*(?:kWh)?\s*-?([\d,.]+)/i,
    );
    if (!compensatedMatch) {
      compensatedMatch = text.match(
        /Créd\.\s*Energia\s*(?:kWh)?\s*(\d+)\s*(?:kWh)?\s*-?([\d,.]+)/i,
      );
    }
    if (!compensatedMatch) {
      throw new Error('Compensated energy values not found in PDF');
    }
    const compensatedEnergyQuantity = parseInt(compensatedMatch[1]);
    const compensatedEnergyValue = parseFloat(
      compensatedMatch[2].replace('.', '').replace(',', '.'),
    );

    let publicLightingMatch = text.match(
      /Contrib(?:uição)?\s+Ilum(?:inação)?\s+Publica\s+Municipal\s*([\d,.]+)/i,
    );
    if (!publicLightingMatch) {
      publicLightingMatch = text.match(/CIP\s*\/\s*COSIP\s*([\d,.]+)/i);
    }
    if (!publicLightingMatch) {
      throw new Error('Public lighting contribution not found in PDF');
    }
    const publicLightingContribution = parseFloat(
      publicLightingMatch[1].replace('.', '').replace(',', '.'),
    );

    this.logger.log(
      `Successfully extracted data from PDF for client ${clientNumber}`,
      'PdfService',
    );

    return {
      clientNumber,
      referenceMonth,
      electricityQuantity,
      electricityValue,
      sceeQuantity,
      sceeValue,
      compensatedEnergyQuantity,
      compensatedEnergyValue,
      publicLightingContribution,
    };
  }
}
