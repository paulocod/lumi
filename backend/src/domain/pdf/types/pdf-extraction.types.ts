import { CreateInvoiceDto } from '../../invoice/dto/create-invoice.dto';

export interface ExtractionConfidence {
  field: string;
  value: string | number;
  confidence: number;
  method: string;
}

export interface CachedExtraction {
  hash: string;
  result: CreateInvoiceDto;
  confidence: ExtractionConfidence[];
  timestamp: Date;
}

export interface InvoiceValidation {
  isValid: boolean;
  errors: string[];
  data?: CreateInvoiceDto;
}

export interface ExtractionError {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

export interface PdfLayout {
  name: string;
  patterns: Record<string, RegExp[]>;
  extract: (text: string) => Promise<Partial<CreateInvoiceDto>>;
}

export class PdfExtractionError extends Error {
  constructor(
    public readonly errors: ExtractionError[],
    public readonly partialData?: Partial<CreateInvoiceDto>,
  ) {
    super('PDF extraction failed');
    this.name = 'PdfExtractionError';
  }
}
