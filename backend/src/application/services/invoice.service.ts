import { Injectable, Inject, Logger } from '@nestjs/common';
import { IInvoiceRepository } from '../../domain/invoice/repositories/invoice.repository';
import { Invoice } from '../../domain/invoice/entities/invoice.entity';
import { InvoiceStatus } from '../../domain/invoice/enums/invoice-status.enum';
import { INVOICE_REPOSITORY } from '../../domain/invoice/invoice.tokens';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoiceCreatedEvent } from '../../shared/events/invoice.events';
import { PdfService } from '../../domain/pdf/pdf.service';
import { PdfSource } from '@/domain/pdf/types/pdf-types';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly pdfService: PdfService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async uploadInvoice(pdf: PdfSource): Promise<Invoice> {
    if (pdf.type === 'buffer') {
      if (!Buffer.isBuffer(pdf.data)) {
        throw new Error('O buffer fornecido não é válido');
      }
      const bufferArray = Array.from(pdf.data);
      pdf = {
        type: 'buffer',
        data: bufferArray,
      };
    }

    const invoice = await this.invoiceRepository.create(
      new Invoice({
        status: InvoiceStatus.PENDING,
        clientNumber: '',
        referenceMonth: new Date(),
        electricityQuantity: 0,
        electricityValue: 0,
        sceeQuantity: 0,
        sceeValue: 0,
        compensatedEnergyQuantity: 0,
        compensatedEnergyValue: 0,
        publicLightingValue: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    this.eventEmitter.emit('invoice.created', {
      invoiceId: invoice.id,
      pdf,
    } as InvoiceCreatedEvent);

    return invoice;
  }

  async getInvoiceStatus(
    id: string,
  ): Promise<{ status: string; error?: string } | null> {
    try {
      const invoice = await this.invoiceRepository.findById(id);
      if (!invoice) {
        return null;
      }

      return {
        status: invoice.status,
        error: invoice.error,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar status da fatura', error);
      throw error;
    }
  }

  async findAll(filters?: {
    clientNumber?: string;
    startDate?: Date;
    endDate?: Date;
    month?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ invoices: Invoice[]; total: number }> {
    return this.invoiceRepository.findAll(filters);
  }
}
