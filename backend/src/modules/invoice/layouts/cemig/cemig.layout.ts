import { PdfLayout } from '@/modules/pdf/types/pdf-types';
import { CreateInvoiceDto } from '../../dtos/create-invoice.dto';

const MONTH_MAP: { [key: string]: number } = {
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
};

export const cemigLayout: PdfLayout<CreateInvoiceDto> = {
  name: 'CEMIG',
  version: '1.0.0',
  patterns: {
    clientNumber: [/Nº\s*DO\s*CLIENTE\s*(\d{10})/i, /\b(\d{10})\b/],
    installationNumber: [
      /N[°ºo]\s*DA\s*INSTALAÇÃO\s*(\d{10})/i,
      /\b(\d{10})\b/,
    ],
    referenceMonth: [
      /Referente\s*[aà]\s*([A-Z]{3})\/(\d{4})/i,
      /\b([A-Z]{3})\/(\d{4})\b/i,
    ],
    electricityQuantity: [
      /Energia\s+Elétrica\s*kWh\s*(\d+(?:\.\d+)?)/i,
      /Energia\s+Elétrica\s*kWh\s+(\d+(?:\.\d+)?)/i,
    ],
    electricityValue: [
      /Energia\s+Elétrica\s*kWh\s*\d+(?:\.\d+)?\s+[\d,.]+\s*([\d,.]+)/i,
      /Energia\s+Elétrica\s*kWh\s+\d+(?:\.\d+)?\s+[\d,.]+\s+([\d,.]+)/i,
    ],
    sceeQuantity: [
      /Energia\s+SCEE\s+s\/\s*ICMS\s*kWh\s*(\d+(?:\.\d+)?)/i,
      /Energia\s+SCEE\s+s\/\s*ICMS\s*kWh\s+(\d+(?:\.\d+)?)/i,
    ],
    sceeValue: [
      /Energia\s+SCEE\s+s\/\s*ICMS\s*kWh\s*\d+(?:\.\d+)?\s+[\d,.]+\s*([\d,.]+)/i,
      /Energia\s+SCEE\s+s\/\s*ICMS\s*kWh\s+\d+(?:\.\d+)?\s+[\d,.]+\s+([\d,.]+)/i,
    ],
    compensatedEnergyQuantity: [
      /Energia\s+compensada\s+GD\s+I\s*kWh\s*(\d+(?:\.\d+)?)/i,
      /Energia\s+compensada\s+GD\s+I\s*kWh\s+(\d+(?:\.\d+)?)/i,
    ],
    compensatedEnergyValue: [
      /Energia\s+compensada\s+GD\s+I\s*kWh\s*\d+(?:\.\d+)?\s+[\d,.]+\s*-([\d,.]+)/i,
      /Energia\s+compensada\s+GD\s+I\s*kWh\s+\d+(?:\.\d+)?\s+[\d,.]+\s+-([\d,.]+)/i,
    ],
    publicLightingValue: [
      /Contrib\s*Ilum\s*Publica\s*Municipal\s*([\d,.]+)/i,
      /Contribuição\s*Iluminação\s*Pública\s*Municipal\s*([\d,.]+)/i,
    ],
  },

  extract: (text: string): Promise<Partial<CreateInvoiceDto>> => {
    const result: Partial<CreateInvoiceDto> = {};

    const findFirstMatch = (patterns: RegExp[]): RegExpMatchArray | null => {
      const normalizedText = text
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      for (const pattern of patterns) {
        const match = normalizedText.match(pattern);
        if (match) return match;
      }

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match;
      }

      return null;
    };

    const parseValue = (value: string): number => {
      try {
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
      } catch {
        return 0;
      }
    };

    const parseInteger = (value: string): number => {
      try {
        return parseFloat(value.replace(/\./g, '').replace(',', '.'));
      } catch {
        return 0;
      }
    };

    const clientNumberMatch = findFirstMatch(cemigLayout.patterns.clientNumber);
    if (clientNumberMatch) {
      result.clientNumber = clientNumberMatch[1];
    }

    const referenceMonthMatch = findFirstMatch(
      cemigLayout.patterns.referenceMonth,
    );
    if (referenceMonthMatch) {
      const monthStr = referenceMonthMatch[1].toUpperCase();
      const month = MONTH_MAP[monthStr];
      const year = parseInt(referenceMonthMatch[2], 10);
      if (month !== undefined && !isNaN(year)) {
        result.referenceMonth = new Date(year, month, 1);
      }
    }

    const electricityQuantityMatch = findFirstMatch(
      cemigLayout.patterns.electricityQuantity,
    );
    if (electricityQuantityMatch) {
      result.electricityQuantity = parseInteger(electricityQuantityMatch[1]);
    }

    const electricityValueMatch = findFirstMatch(
      cemigLayout.patterns.electricityValue,
    );
    if (electricityValueMatch) {
      result.electricityValue = parseValue(electricityValueMatch[1]);
    }

    const sceeQuantityMatch = findFirstMatch(cemigLayout.patterns.sceeQuantity);
    if (sceeQuantityMatch) {
      result.sceeQuantity = parseInteger(sceeQuantityMatch[1]);
    }

    const sceeValueMatch = findFirstMatch(cemigLayout.patterns.sceeValue);
    if (sceeValueMatch) {
      result.sceeValue = parseValue(sceeValueMatch[1]);
    }

    const compensatedEnergyQuantityMatch = findFirstMatch(
      cemigLayout.patterns.compensatedEnergyQuantity,
    );
    if (compensatedEnergyQuantityMatch) {
      result.compensatedEnergyQuantity = parseInteger(
        compensatedEnergyQuantityMatch[1],
      );
    }

    const compensatedEnergyValueMatch = findFirstMatch(
      cemigLayout.patterns.compensatedEnergyValue,
    );
    if (compensatedEnergyValueMatch) {
      result.compensatedEnergyValue = -parseValue(
        compensatedEnergyValueMatch[1],
      );
    }

    const publicLightingValueMatch = findFirstMatch(
      cemigLayout.patterns.publicLightingValue,
    );
    if (publicLightingValueMatch) {
      result.publicLightingValue = parseValue(publicLightingValueMatch[1]);
    }

    return Promise.resolve(result);
  },

  validate: (data: Partial<CreateInvoiceDto>): boolean => {
    if (!data.clientNumber || !data.referenceMonth) {
      return false;
    }

    if (!/^\d{10}$/.test(data.clientNumber)) {
      return false;
    }

    if (
      !(data.referenceMonth instanceof Date) ||
      isNaN(data.referenceMonth.getTime())
    ) {
      return false;
    }

    const numericFields = [
      'electricityQuantity',
      'electricityValue',
      'sceeQuantity',
      'sceeValue',
      'compensatedEnergyQuantity',
      'compensatedEnergyValue',
      'publicLightingValue',
    ];

    return numericFields.every(
      (field) =>
        typeof (data as Record<string, number>)[field] === 'number' &&
        !isNaN((data as Record<string, number>)[field]),
    );
  },
};
