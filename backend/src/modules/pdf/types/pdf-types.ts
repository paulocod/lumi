export type PdfSource = {
  type: 'buffer' | 'url' | 'bucket';
  data: string | Buffer | number[];
  key?: string;
};

export interface ExtractionConfidence {
  field: string;
  value: string | number;
  confidence: number;
  method: string;
}

export interface PdfExtractionResult<T> {
  data: T;
  confidence: ExtractionConfidence[];
  metadata: {
    numPages: number;
    layout: string;
    processingTime: number;
  };
}

export interface ExtractionError {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

export interface PdfLayout<T> {
  name: string;
  version: string;
  patterns: Record<string, RegExp[]>;
  extract: (text: string) => Promise<Partial<T>>;
  validate: (data: Partial<T>) => boolean;
}

export interface PdfValidationResult {
  isValid: boolean;
  errors: string[];
  metadata?: {
    numPages: number;
    fileSize: number;
    processingTime: number;
  };
}

export interface CachedExtraction {
  hash: string;
  result: Record<string, any>;
  confidence: ExtractionConfidence[];
  timestamp: Date;
}

export class PdfExtractionError extends Error {
  constructor(
    public readonly errors: ExtractionError[],
    public readonly partialData?: Record<string, any>,
  ) {
    super('PDF extraction failed');
    this.name = 'PdfExtractionError';
  }
}

export interface PdfLayoutRegistry {
  [key: string]: PdfLayout<any>;
}
