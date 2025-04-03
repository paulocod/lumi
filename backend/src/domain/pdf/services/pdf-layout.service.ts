import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../config/logger.service';
import { CreateInvoiceDto } from '../../invoice/dto/create-invoice.dto';
import { PdfLayout } from '../types/pdf-extraction.types';

@Injectable()
export class PdfLayoutService {
  private readonly layouts: PdfLayout[] = [
    {
      name: 'CEMIG',
      patterns: {
        clientNumber: [
          /N[°ºo]\s*DO\s*CLIENTE\s*(\d{10})/i,
          /\b(\d{10})\b/,
          /^(\d{10})$/m,
        ],
        installationNumber: [
          /N[°ºo]\s*DA\s*INSTALAÇÃO\s*(\d{10})/i,
          /\b(\d{10})\b/,
        ],
        referenceMonth: [
          /Referente\s*[aà]\s*([A-Z]{3})\/(\d{4})/i,
          /\b([A-Z]{3})\/(\d{4})\b/i,
          /\b(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\/(\d{4})\b/i,
        ],
        electricityQuantity: [
          /Energia\s+Elétrica\s*kWh\s*(\d+)/i,
          /Energia\s+Elétrica\s*(?:kWh)?\s*(\d+(?:\.\d+)?)/i,
        ],
        electricityValue: [
          /Energia\s+Elétrica\s*kWh\s*\d+\s*[\d,.]+\s*([\d,.]+)/i,
          /Energia\s+Elétrica\s*(?:kWh)?\s*\d+(?:\.\d+)?\s*[\d,.]+\s*([\d,.]+)/i,
        ],
        sceeQuantity: [
          /Energia\s+SCEE\s+s\/\s*ICMS\s*kWh\s*(\d+)/i,
          /Energia\s+SCEE\s*(?:s\/\s*ICMS)?\s*kWh\s*(\d+(?:\.\d+)?)/i,
        ],
        sceeValue: [
          /Energia\s+SCEE\s+s\/\s*ICMS\s*kWh\s*\d+\s*[\d,.]+\s*([\d,.]+)/i,
          /Energia\s+SCEE\s*(?:s\/\s*ICMS)?\s*kWh\s*\d+(?:\.\d+)?\s*[\d,.]+\s*([\d,.]+)/i,
        ],
        compensatedEnergyQuantity: [
          /Energia\s+compensada\s+GD\s+I\s*kWh\s*(\d+)/i,
          /Energia\s+compensada\s*(?:GD\s+I)?\s*kWh\s*(\d+(?:\.\d+)?)/i,
        ],
        compensatedEnergyValue: [
          /Energia\s+compensada\s+GD\s+I\s*kWh\s*\d+\s*[\d,.]+\s*-([\d,.]+)/i,
          /Energia\s+compensada\s*(?:GD\s+I)?\s*kWh\s*\d+(?:\.\d+)?\s*[\d,.]+\s*-([\d,.]+)/i,
        ],
        publicLightingContribution: [
          /Contrib\s*Ilum\s*Publica\s*Municipal\s*([\d,.]+)/i,
          /Contribuição\s*Iluminação\s*Pública\s*Municipal\s*([\d,.]+)/i,
        ],
      },
      extract: (text: string): Promise<Partial<CreateInvoiceDto>> => {
        const monthMap: { [key: string]: number } = {
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

        const result: Partial<CreateInvoiceDto> = {};
        const layout = this.layouts[0];

        const clientNumberMatch = this.findFirstMatch(
          text,
          layout.patterns.clientNumber,
        );
        if (clientNumberMatch) {
          result.clientNumber = clientNumberMatch[1];
        } else {
          this.logger.warn(
            'Número do cliente não encontrado no texto',
            'PdfLayoutService',
          );
        }

        const referenceMonthMatch = this.findFirstMatch(
          text,
          layout.patterns.referenceMonth,
        );
        if (referenceMonthMatch) {
          const monthStr = referenceMonthMatch[1].toUpperCase();
          const month = monthMap[monthStr as keyof typeof monthMap];
          const year = parseInt(referenceMonthMatch[2]);
          if (month !== undefined && !isNaN(year)) {
            result.referenceMonth = new Date(year, month, 1);
          } else {
            this.logger.warn(
              `Mês de referência inválido: ${monthStr}/${year}`,
              'PdfLayoutService',
            );
          }
        } else {
          this.logger.warn(
            'Mês de referência não encontrado no texto',
            'PdfLayoutService',
          );
        }

        const electricityQuantityMatch = this.findFirstMatch(
          text,
          layout.patterns.electricityQuantity,
        );
        if (electricityQuantityMatch) {
          result.electricityQuantity = parseInt(electricityQuantityMatch[1]);
        } else {
          this.logger.warn(
            'Quantidade de energia elétrica não encontrada no texto',
            'PdfLayoutService',
          );
        }

        const electricityValueMatch = this.findFirstMatch(
          text,
          layout.patterns.electricityValue,
        );
        if (electricityValueMatch) {
          result.electricityValue = this.parseValue(electricityValueMatch[1]);
        } else {
          this.logger.warn(
            'Valor de energia elétrica não encontrado no texto',
            'PdfLayoutService',
          );
        }

        const sceeQuantityMatch = this.findFirstMatch(
          text,
          layout.patterns.sceeQuantity,
        );
        if (sceeQuantityMatch) {
          result.sceeQuantity = parseInt(sceeQuantityMatch[1]);
        } else {
          this.logger.warn(
            'Quantidade de energia SCEE não encontrada no texto',
            'PdfLayoutService',
          );
        }

        const sceeValueMatch = this.findFirstMatch(
          text,
          layout.patterns.sceeValue,
        );
        if (sceeValueMatch) {
          result.sceeValue = this.parseValue(sceeValueMatch[1]);
        } else {
          this.logger.warn(
            'Valor de energia SCEE não encontrado no texto',
            'PdfLayoutService',
          );
        }

        const compensatedEnergyQuantityMatch = this.findFirstMatch(
          text,
          layout.patterns.compensatedEnergyQuantity,
        );
        if (compensatedEnergyQuantityMatch) {
          result.compensatedEnergyQuantity = parseInt(
            compensatedEnergyQuantityMatch[1],
          );
        } else {
          this.logger.warn(
            'Quantidade de energia compensada não encontrada no texto',
            'PdfLayoutService',
          );
        }

        const compensatedEnergyValueMatch = this.findFirstMatch(
          text,
          layout.patterns.compensatedEnergyValue,
        );
        if (compensatedEnergyValueMatch) {
          result.compensatedEnergyValue = -this.parseValue(
            compensatedEnergyValueMatch[1],
          );
        } else {
          this.logger.warn(
            'Valor de energia compensada não encontrado no texto',
            'PdfLayoutService',
          );
        }

        const publicLightingContributionMatch = this.findFirstMatch(
          text,
          layout.patterns.publicLightingContribution,
        );
        if (publicLightingContributionMatch) {
          result.publicLightingContribution = this.parseValue(
            publicLightingContributionMatch[1],
          );
        } else {
          this.logger.warn(
            'Contribuição de iluminação pública não encontrada no texto',
            'PdfLayoutService',
          );
        }

        return Promise.resolve(result);
      },
    },
  ];

  constructor(private readonly logger: LoggerService) {}

  getLayouts(): PdfLayout[] {
    return this.layouts;
  }

  private findFirstMatch(
    text: string,
    patterns: RegExp[],
  ): RegExpMatchArray | null {
    const normalizedText = text
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const texts = [normalizedText, text];

    for (const currentText of texts) {
      for (const pattern of patterns) {
        const match = currentText.match(pattern);
        if (match) {
          return match;
        }
      }
    }
    return null;
  }

  private parseValue(value: string): number {
    return parseFloat(value.replace('.', '').replace(',', '.'));
  }
}
