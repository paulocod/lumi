/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Inject, Logger } from '@nestjs/common';
import { IInvoiceRepository } from '../../domain/invoice/repositories/invoice.repository';
import {
  Invoice,
  InvoiceStatus,
} from '../../domain/invoice/entities/invoice.entity';
import { INVOICE_REPOSITORY } from '../../domain/invoice/invoice.tokens';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoiceCreatedEvent, PdfSource } from '@/shared/events/invoice.events';
import { PdfService } from '@/domain/pdf/pdf.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly pdfService: PdfService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async uploadInvoice(
    pdf: PdfSource,
  ): Promise<{ invoiceId: string; status: string }> {
    try {
      this.logger.log('Iniciando upload de fatura');

      const now = new Date();
      const invoice = new Invoice({
        status: InvoiceStatus.PENDING,
        clientNumber: '',
        referenceMonth: now,
        electricityQuantity: 0,
        electricityValue: 0,
        sceeQuantity: 0,
        sceeValue: 0,
        compensatedEnergyQuantity: 0,
        compensatedEnergyValue: 0,
        publicLightingValue: 0,
        createdAt: now,
        updatedAt: now,
      });

      const createdInvoice = await this.invoiceRepository.create(invoice);
      if (!createdInvoice.id) {
        throw new Error('Fatura criada sem ID');
      }

      this.eventEmitter.emit('invoice.created', {
        invoiceId: createdInvoice.id,
        pdf,
      } as InvoiceCreatedEvent);

      return {
        invoiceId: createdInvoice.id,
        status: createdInvoice.status,
      };
    } catch (error) {
      this.logger.error('Erro ao fazer upload da fatura', error);
      throw error;
    }
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
