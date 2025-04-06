/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@/config/logger';
import { PdfValidationResult, ExtractionError } from '../../types/pdf-types';
import * as pdf from 'pdf-parse';

interface PdfParseResult {
  numpages: number;
  text: string;
}

@Injectable()
export class PdfValidationService {
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.maxFileSize =
      this.configService.get<number>('pdf.maxSize') || 5 * 1024 * 1024; // 5MB
    this.allowedMimeTypes = this.configService.get<string[]>(
      'pdf.allowedTypes',
    ) || ['application/pdf'];
  }

  async validatePdf(buffer: Buffer): Promise<PdfValidationResult> {
    this.logger.debug('=== Início da Validação do PDF ===');

    try {
      if (buffer.length > this.maxFileSize) {
        return this.createValidationError(
          `Arquivo muito grande. Máximo permitido: ${this.maxFileSize / 1024 / 1024}MB`,
        );
      }

      const pdfData = (await pdf(buffer)) as PdfParseResult;

      if (pdfData.numpages === 0) {
        return this.createValidationError('PDF não contém páginas');
      }

      if (!pdfData.text || pdfData.text.trim().length < 100) {
        return this.createValidationError(
          'PDF não contém texto suficiente para extração',
        );
      }

      return {
        isValid: true,
        errors: [],
        metadata: {
          numPages: pdfData.numpages,
          fileSize: buffer.length,
          processingTime: Date.now(),
        },
      };
    } catch (error) {
      this.logger.error('Erro na validação do PDF', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      return this.createValidationError(
        `Erro ao validar o PDF: ${errorMessage}`,
      );
    }
  }

  validateExtractedData<T>(
    data: Partial<T>,
    requiredFields: string[],
    numericFields: string[],
  ): PdfValidationResult & { data?: T } {
    const errors: ExtractionError[] = [];

    try {
      for (const field of requiredFields) {
        this.validateRequiredField(
          data[field as keyof T],
          field,
          field,
          errors,
        );
      }

      for (const field of numericFields) {
        this.validateNumericField(
          data[field as keyof T] as number | undefined,
          field,
          field,
          errors,
        );
      }

      if (errors.length > 0) {
        this.logger.warn(
          `Validação falhou com ${errors.length} erros`,
          'PdfValidationService',
        );
      }

      return {
        isValid: errors.length === 0,
        errors: errors.map((e) => e.message),
        data: errors.length === 0 ? (data as T) : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Erro durante a validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'PdfValidationService',
      );
      return this.createValidationError('Erro interno durante a validação');
    }
  }

  private createValidationError(message: string): PdfValidationResult {
    return {
      isValid: false,
      errors: [message],
    };
  }

  private validateRequiredField(
    value: unknown,
    field: string,
    fieldName: string,
    errors: ExtractionError[],
  ): void {
    if (!value) {
      this.logger.warn(
        `${fieldName} inválido: ${String(value)}`,
        'PdfValidationService',
      );
      errors.push({
        code: `INVALID_${field.toUpperCase()}`,
        message: `${fieldName} inválido`,
        field,
      });
    }
  }

  private validateNumericField(
    value: number | undefined,
    field: string,
    fieldName: string,
    errors: ExtractionError[],
  ): void {
    if (typeof value !== 'number' || value < 0) {
      this.logger.warn(
        `${fieldName} inválido: ${value}`,
        'PdfValidationService',
      );
      errors.push({
        code: `INVALID_${field.toUpperCase()}`,
        message: `${fieldName} inválido`,
        field,
      });
    }
  }
}
