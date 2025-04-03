import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../config/logger.service';
import { CreateInvoiceDto } from '../../invoice/dto/create-invoice.dto';
import {
  InvoiceValidation,
  ExtractionError,
} from '../types/pdf-extraction.types';

@Injectable()
export class PdfValidationService {
  constructor(private readonly logger: LoggerService) {}

  validateExtractedData(data: Partial<CreateInvoiceDto>): InvoiceValidation {
    const errors: ExtractionError[] = [];

    try {
      if (!data.clientNumber || !/^\d+$/.test(data.clientNumber)) {
        this.logger.warn(
          `Número do cliente inválido: ${data.clientNumber}`,
          'PdfValidationService',
        );
        errors.push({
          code: 'INVALID_CLIENT_NUMBER',
          message: 'Número do cliente inválido',
          field: 'clientNumber',
        });
      }

      if (!data.referenceMonth || isNaN(data.referenceMonth.getTime())) {
        this.logger.warn(
          `Mês de referência inválido: ${data.referenceMonth?.toISOString() ?? 'undefined'}`,
          'PdfValidationService',
        );
        errors.push({
          code: 'INVALID_REFERENCE_MONTH',
          message: 'Mês de referência inválido',
          field: 'referenceMonth',
        });
      }

      if (
        typeof data.electricityQuantity !== 'number' ||
        data.electricityQuantity < 0
      ) {
        this.logger.warn(
          `Quantidade de energia elétrica inválida: ${data.electricityQuantity}`,
          'PdfValidationService',
        );
        errors.push({
          code: 'INVALID_ELECTRICITY_QUANTITY',
          message: 'Quantidade de energia elétrica inválida',
          field: 'electricityQuantity',
        });
      }

      if (
        typeof data.electricityValue !== 'number' ||
        data.electricityValue < 0
      ) {
        this.logger.warn(
          `Valor de energia elétrica inválido: ${data.electricityValue}`,
          'PdfValidationService',
        );
        errors.push({
          code: 'INVALID_ELECTRICITY_VALUE',
          message: 'Valor de energia elétrica inválido',
          field: 'electricityValue',
        });
      }

      if (typeof data.sceeQuantity !== 'number' || data.sceeQuantity < 0) {
        this.logger.warn(
          `Quantidade de energia SCEE inválida: ${data.sceeQuantity}`,
          'PdfValidationService',
        );
        errors.push({
          code: 'INVALID_SCEE_QUANTITY',
          message: 'Quantidade de energia SCEE inválida',
          field: 'sceeQuantity',
        });
      }

      if (typeof data.sceeValue !== 'number' || data.sceeValue < 0) {
        this.logger.warn(
          `Valor de energia SCEE inválido: ${data.sceeValue}`,
          'PdfValidationService',
        );
        errors.push({
          code: 'INVALID_SCEE_VALUE',
          message: 'Valor de energia SCEE inválido',
          field: 'sceeValue',
        });
      }

      if (
        typeof data.compensatedEnergyQuantity !== 'number' ||
        data.compensatedEnergyQuantity < 0
      ) {
        this.logger.warn(
          `Quantidade de energia compensada inválida: ${data.compensatedEnergyQuantity}`,
          'PdfValidationService',
        );
        errors.push({
          code: 'INVALID_COMPENSATED_ENERGY_QUANTITY',
          message: 'Quantidade de energia compensada inválida',
          field: 'compensatedEnergyQuantity',
        });
      }

      if (typeof data.compensatedEnergyValue !== 'number') {
        this.logger.warn(
          `Valor de energia compensada inválido: ${data.compensatedEnergyValue}`,
          'PdfValidationService',
        );
        errors.push({
          code: 'INVALID_COMPENSATED_ENERGY_VALUE',
          message: 'Valor de energia compensada inválido',
          field: 'compensatedEnergyValue',
        });
      }

      if (
        typeof data.publicLightingContribution !== 'number' ||
        data.publicLightingContribution < 0
      ) {
        this.logger.warn(
          `Contribuição de iluminação pública inválida: ${data.publicLightingContribution}`,
          'PdfValidationService',
        );
        errors.push({
          code: 'INVALID_PUBLIC_LIGHTING_CONTRIBUTION',
          message: 'Contribuição de iluminação pública inválida',
          field: 'publicLightingContribution',
        });
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
        data: errors.length === 0 ? (data as CreateInvoiceDto) : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Erro durante a validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'PdfValidationService',
      );

      return {
        isValid: false,
        errors: ['Erro interno durante a validação'],
      };
    }
  }
}
