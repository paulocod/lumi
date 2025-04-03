export type PdfSource = {
  type: 'buffer' | 'url';
  data: string | Buffer | number[];
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
