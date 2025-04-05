/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../config/logger';
import { PdfValidationService } from './validation/pdf-validation.service';
import { PdfLayoutService } from './layout/pdf-layout.service';
import { PdfExtractionError } from '../types/pdf-types';
import * as pdf from 'pdf-parse';
import { CachedExtraction } from '../types/pdf-extraction.types';
import { CreateInvoiceDto } from '@/modules/invoice/dtos/create-invoice.dto';
import { PdfCacheService } from './cache/pdf-cache.service';

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

  private readonly monthVariations: { [key: string]: string } = {
    AIO: 'MAI',
    MA1: 'MAI',
    MAL: 'MAI',
    MA10: 'MAIO',
    JUL10: 'JULHO',
    AGO5TO: 'AGOSTO',
    SET3: 'SET',
    N0V: 'NOV',
    DEZ12: 'DEZ',
  };

  private normalizeMonth(month: string): string {
    const normalized = month.toUpperCase().trim();
    return this.monthVariations[normalized] || normalized;
  }

  constructor(
    private readonly logger: LoggerService,
    private readonly cacheService: PdfCacheService,
    private readonly validationService: PdfValidationService,
    private readonly layoutService: PdfLayoutService,
  ) {}

  async extractInvoiceFromPdf(buffer: Buffer): Promise<CreateInvoiceDto> {
    this.logger.debug('=== Início da Extração do PDF ===');
    this.logger.debug(
      `Buffer recebido: ${JSON.stringify({
        isBuffer: Buffer.isBuffer(buffer),
        length: buffer.length,
        type: typeof buffer,
      })}`,
    );

    try {
      if (!Buffer.isBuffer(buffer)) {
        this.logger.error('Erro: Buffer inválido no PdfService');
        throw new PdfExtractionError([
          {
            code: 'INVALID_BUFFER',
            message: 'O buffer fornecido não é válido',
          },
        ]);
      }

      const cached = await this.cacheService.getCachedExtraction(buffer);
      if (cached) {
        this.logger.debug('Usando cache para extração');
        return cached.result;
      }

      this.logger.debug('Iniciando processamento do PDF');
      const extraction = await this.processPdf(buffer);

      try {
        this.logger.debug('Salvando extração no cache');
        await this.cacheService.setCachedExtraction(buffer, extraction);
      } catch (error) {
        this.logger.error('Erro ao salvar cache', error);
      }

      return extraction.result;
    } catch (error) {
      this.logger.error('Erro na extração', error);
      throw error;
    }
  }

  private async processPdf(buffer: Buffer): Promise<CachedExtraction> {
    this.logger.debug('=== Início do Processamento do PDF ===');
    try {
      await this.validationService.validatePdf(buffer);
      const data = (await pdf(buffer)) as PdfData;
      const text = data.text;

      if (!text || text.trim().length === 0) {
        this.logger.error('Erro: PDF não contém texto extraível');
        throw new PdfExtractionError([
          {
            code: 'PDF_EMPTY',
            message: 'PDF não contém texto extraível',
          },
        ]);
      }

      this.logger.debug(`Texto extraído do PDF: ${text.substring(0, 500)}...`);

      this.logger.debug('Tentando extração via layout');
      const layoutExtraction = await this.layoutService.extract(text);
      this.logger.debug(
        `Resultado da extração via layout: ${JSON.stringify(layoutExtraction)}`,
      );

      if (!this.isExtractionComplete(layoutExtraction)) {
        this.logger.warn(
          'Extração via layout incompleta, usando método fallback',
        );
        return this.fallbackExtraction(text);
      }

      this.logger.debug('Extração via layout bem sucedida');
      const validation = this.validationService.validateExtractedData(
        layoutExtraction as CreateInvoiceDto,
      );

      if (!validation.isValid || !validation.data) {
        this.logger.error(
          `Validação dos dados extraídos falhou: ${validation.errors.join(', ')}`,
        );
        throw new PdfExtractionError(
          validation.errors.map((message) => ({
            code: 'VALIDATION_FAILED',
            message,
          })),
        );
      }

      this.logger.debug('Validação dos dados extraídos bem sucedida');
      const hash = this.cacheService.generatePdfHash(buffer);

      return {
        hash,
        result: validation.data,
        confidence: [
          {
            field: 'clientNumber',
            value: validation.data.clientNumber,
            confidence: 1,
            method: 'layout',
          },
          {
            field: 'referenceMonth',
            value: validation.data.referenceMonth.toISOString(),
            confidence: 1,
            method: 'layout',
          },
        ],
        timestamp: new Date(),
      };
    } catch (error) {
      if (error instanceof PdfExtractionError) {
        this.logger.error(`Erro de extração: ${JSON.stringify(error.errors)}`);
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Erro ao processar PDF: ${errorMessage}`);
      throw new PdfExtractionError([
        {
          code: 'PDF_PROCESSING_ERROR',
          message: `Erro ao processar o arquivo PDF: ${errorMessage}`,
        },
      ]);
    }
  }

  private isExtractionComplete(extraction: Partial<CreateInvoiceDto>): boolean {
    return (
      !!extraction.clientNumber &&
      !!extraction.referenceMonth &&
      typeof extraction.electricityQuantity === 'number' &&
      typeof extraction.electricityValue === 'number' &&
      typeof extraction.sceeQuantity === 'number' &&
      typeof extraction.sceeValue === 'number' &&
      typeof extraction.compensatedEnergyQuantity === 'number' &&
      typeof extraction.compensatedEnergyValue === 'number' &&
      typeof extraction.publicLightingValue === 'number'
    );
  }

  private fallbackExtraction(text: string): CachedExtraction {
    const clientNumberRegex = /N[ºo°]\s*DO\s*CLIENTE\s*(\d{10})/i;
    const installationRegex = /N[ºo°]\s*DA\s*INSTALAÇÃO\s*(\d{10})/i;

    const clientNumberMatch = text.match(clientNumberRegex);
    const installationMatch = text.match(installationRegex);

    let clientNumber: string;

    if (!clientNumberMatch && !installationMatch) {
      const fallbackMatch = text.match(/\b(\d{10})\b/);
      if (!fallbackMatch) {
        this.logger.error('Número do cliente não encontrado no PDF');
        throw new PdfExtractionError([
          {
            code: 'CLIENT_NUMBER_NOT_FOUND',
            message: 'Número do cliente não encontrado no PDF',
          },
        ]);
      }
      clientNumber = fallbackMatch[1];
    } else {
      clientNumber = (clientNumberMatch || installationMatch)![1];
    }

    const patterns = [
      /Referente\s+a\s+([A-Za-z]{3})\/(\d{4})/i,
      /Referente\s+a\s+FEV\/(\d{4})/i,
      /MÊS\/ANO\s*([A-Za-z]{3})\/(\d{2})/i,
      /(\w{3})\/(\d{4})/i,
    ];

    let monthStr: string | null = null;
    let yearStr: string | null = null;

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match.length === 3) {
          monthStr = this.normalizeMonth(match[1]);
          yearStr = match[2];
        } else {
          monthStr = 'FEV';
          yearStr = match[1];
        }
        break;
      }
    }

    if (!monthStr || !yearStr) {
      this.logger.error('Mês de referência não encontrado no PDF');
      throw new PdfExtractionError([
        {
          code: 'REFERENCE_MONTH_NOT_FOUND',
          message: 'Mês de referência não encontrado no PDF',
        },
      ]);
    }

    monthStr = monthStr.toUpperCase();
    const month = this.monthMap[monthStr];
    if (month === undefined) {
      this.logger.error(`Mês inválido encontrado: ${monthStr}`);
      throw new PdfExtractionError([
        {
          code: 'INVALID_MONTH',
          message: `Mês inválido: ${monthStr}`,
        },
      ]);
    }

    const year = parseInt(yearStr);
    const referenceMonth = new Date(year, month, 1);

    const extractedData = this.processExtractedData(
      text,
      clientNumber,
      referenceMonth,
    );

    const validation =
      this.validationService.validateExtractedData(extractedData);

    if (!validation.isValid || !validation.data) {
      this.logger.error(
        `Validação dos dados extraídos falhou: ${validation.errors.join(', ')}`,
      );
      throw new PdfExtractionError(
        validation.errors.map((message) => ({
          code: 'VALIDATION_FAILED',
          message,
        })),
      );
    }

    const hash = this.cacheService.generatePdfHash(Buffer.from(text));

    return {
      hash,
      result: validation.data,
      confidence: [
        {
          field: 'clientNumber',
          value: validation.data.clientNumber,
          confidence: 1,
          method: 'fallback',
        },
        {
          field: 'referenceMonth',
          value: validation.data.referenceMonth.toISOString(),
          confidence: 1,
          method: 'fallback',
        },
      ],
      timestamp: new Date(),
    };
  }

  private processExtractedData(
    text: string,
    clientNumber: string,
    referenceMonth: Date,
  ): CreateInvoiceDto {
    const patterns = {
      electricity: [
        /Energia\s+Elétrica\s+kWh\s+(\d+)\s+[\d,]+\s+([\d,]+)/i,
        /Energia\s+Elétrica\s+(\d+)\s+[\d,]+\s+([\d,]+)/i,
        /Energia\s+Elétrica\s+([\d,]+)/i,
      ],
      scee: [
        /Energia\s+SCEE\s+s\/\s*ICMS\s+kWh\s+(\d+)\s+[\d,]+\s+([\d,]+)/i,
        /Energia\s+SCEE\s+(\d+)\s+[\d,]+\s+([\d,]+)/i,
        /Energia\s+SCEE\s+([\d,]+)/i,
      ],
      compensated: [
        /Energia\s+compensada\s+GD\s+I\s+kWh\s+(\d+)\s+[\d,]+\s+-([\d,]+)/i,
        /Energia\s+compensada\s+(\d+)\s+[\d,]+\s+-([\d,]+)/i,
        /Energia\s+compensada\s+-([\d,]+)/i,
      ],
      publicLighting: [
        /Contrib\s+Ilum\s+Publica\s+Municipal\s+([\d,]+)/i,
        /Iluminação\s+Pública\s+([\d,]+)/i,
        /Contribuição\s+Iluminação\s+([\d,]+)/i,
      ],
    };

    const extractValue = (patterns: RegExp[], text: string) => {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          if (match.length === 3) {
            return {
              quantity: parseInt(match[1]),
              value: parseFloat(match[2].replace(',', '.')),
            };
          } else if (match.length === 2) {
            return {
              quantity: 0,
              value: parseFloat(match[1].replace(',', '.')),
            };
          }
        }
      }
      return null;
    };

    const electricityData = extractValue(patterns.electricity, text);
    const sceeData = extractValue(patterns.scee, text);
    const compensatedData = extractValue(patterns.compensated, text);

    let publicLightingValue = 0;
    for (const pattern of patterns.publicLighting) {
      const match = text.match(pattern);
      if (match) {
        publicLightingValue = parseFloat(match[1].replace(',', '.'));
        break;
      }
    }

    if (!sceeData) {
      this.logger.warn(
        'Valores de energia SCEE não encontrados, usando valores padrão',
      );
    }

    if (!compensatedData) {
      this.logger.warn(
        'Valores de energia compensada não encontrados, usando valores padrão',
      );
    }

    return {
      clientNumber,
      referenceMonth,
      electricityQuantity: electricityData?.quantity || 0,
      electricityValue: electricityData?.value || 0,
      sceeQuantity: sceeData?.quantity || 0,
      sceeValue: sceeData?.value || 0,
      compensatedEnergyQuantity: compensatedData?.quantity || 0,
      compensatedEnergyValue: compensatedData?.value || 0,
      publicLightingValue,
    };
  }
}
