import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from '../invoice/dto/create-invoice.dto';
import * as pdf from 'pdf-parse';
import { LoggerService } from '../../config/logger.service';

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

  constructor(private readonly logger: LoggerService) {}

  async extractInvoiceFromPdf(buffer: Buffer): Promise<CreateInvoiceDto> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const data = (await pdf(buffer)) as PdfData;
      const text = data.text;

      let clientNumberMatch: RegExpMatchArray | null = text.match(
        /Nº DA INSTALAÇÃO\s*(\d+)/i,
      );
      if (!clientNumberMatch) {
        clientNumberMatch = text.match(
          /(?:Instalação|Unidade Consumidora):\s*(\d+)/i,
        );
      }
      if (!clientNumberMatch) {
        throw new Error('Client number not found in PDF');
      }
      const clientNumber = clientNumberMatch[1];

      let referenceMonthMatch: RegExpMatchArray | null = text.match(
        /(?:Referente a|Fatura de):?\s*([A-Za-zç]+)\s*(?:de)?\s*(\d{4})/i,
      );
      if (!referenceMonthMatch) {
        referenceMonthMatch = text.match(/([A-Z]{3,})\/(\d{4})/i);
      }
      if (!referenceMonthMatch) {
        referenceMonthMatch = text.match(/(\d{2})\/(\d{4})/);
        if (referenceMonthMatch) {
          const month = parseInt(referenceMonthMatch[1]) - 1;
          const year = parseInt(referenceMonthMatch[2]);
          return this.processExtractedData(
            text,
            clientNumber,
            new Date(year, month, 1),
          );
        }
      }

      if (!referenceMonthMatch) {
        throw new Error('Reference month not found in PDF');
      }

      const monthStr = referenceMonthMatch[1].toUpperCase();
      const month = this.monthMap[monthStr as keyof typeof this.monthMap];
      if (month === undefined) {
        throw new Error(`Invalid month format: ${monthStr}`);
      }
      const year = parseInt(referenceMonthMatch[2]);
      const referenceMonth = new Date(year, month, 1);

      return this.processExtractedData(text, clientNumber, referenceMonth);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error extracting data from PDF: ${errorMessage}`,
        'PdfService',
      );
      throw error;
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
