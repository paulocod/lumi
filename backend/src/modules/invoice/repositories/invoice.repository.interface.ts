import { Invoice } from '../entities/invoice.entity';
import { InvoiceStatus } from '../../../shared/enums/invoice-status.enum';

export interface IInvoiceRepository {
  create(invoice: Invoice): Promise<Invoice>;
  findById(id: string): Promise<Invoice | null>;
  findByClientNumber(clientNumber: string): Promise<Invoice[]>;
  findByClientNumberAndMonth(
    clientNumber: string,
    month: Date,
  ): Promise<Invoice | null>;
  findAll(filters?: {
    clientNumber?: string;
    startDate?: Date;
    endDate?: Date;
    month?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ invoices: Invoice[]; total: number }>;
  findByStatus(status: InvoiceStatus): Promise<Invoice[]>;
  updateStatus(id: string, status: InvoiceStatus): Promise<Invoice>;
}
