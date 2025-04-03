import { Invoice, InvoiceStatus } from '../entities/invoice.entity';

export interface IInvoiceRepository {
  create(invoice: Invoice): Promise<Invoice>;
  findByClientNumber(clientNumber: string): Promise<Invoice[]>;
  findByClientNumberAndMonth(
    clientNumber: string,
    month: Date,
  ): Promise<Invoice | null>;
  findAll(): Promise<Invoice[]>;
  findByStatus(status: InvoiceStatus): Promise<Invoice[]>;
  updateStatus(id: string, status: InvoiceStatus): Promise<Invoice>;
}
