import { Injectable, Inject } from '@nestjs/common';
import { IInvoiceRepository } from '../../domain/invoice/repositories/invoice.repository';
import { Invoice } from '../../domain/invoice/entities/invoice.entity';
import { INVOICE_REPOSITORY } from '../../domain/invoice/invoice.tokens';

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: IInvoiceRepository,
  ) {}

  async create(invoice: Invoice): Promise<Invoice> {
    return this.invoiceRepository.create(invoice);
  }

  async findByClientNumber(clientNumber: string): Promise<Invoice[]> {
    return this.invoiceRepository.findByClientNumber(clientNumber);
  }

  async findByClientNumberAndMonth(
    clientNumber: string,
    month: Date,
  ): Promise<Invoice | null> {
    return this.invoiceRepository.findByClientNumberAndMonth(
      clientNumber,
      month,
    );
  }

  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.findAll();
  }
}
