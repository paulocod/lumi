export type PdfSource =
  | {
      type: 'buffer';
      data: Buffer;
    }
  | {
      type: 'url';
      data: string;
    };

export interface InvoiceCreatedEvent {
  invoiceId: string;
  pdf: PdfSource;
}

export interface InvoiceProcessedEvent {
  invoiceId: string;
  success: boolean;
  error?: string;
}
