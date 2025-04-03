import { Invoice } from '../entities/invoice.entity';

export interface IInvoiceRepository {
  create(invoice: Invoice): Promise<Invoice>;
  findByClientNumber(clientNumber: string): Promise<Invoice[]>;
  findByClientNumberAndMonth(
    clientNumber: string,
    month: Date,
  ): Promise<Invoice | null>;
  findAll(): Promise<Invoice[]>;
}
