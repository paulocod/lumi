import { PdfSource } from '../../modules/pdf/types/pdf-types';

export interface InvoiceCreatedEvent {
  invoiceId: string;
  pdf: PdfSource;
}

export interface InvoiceProcessedEvent {
  invoiceId: string;
  success: boolean;
  error?: string;
}
