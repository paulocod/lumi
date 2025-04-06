import { Injectable, Inject, Logger } from '@nestjs/common';
import { IInvoiceRepository } from '../repositories/invoice.repository.interface';
import { InvoiceStatus } from '../../../shared/enums/invoice-status.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PdfService } from '../../pdf/services/pdf.service';
import { PdfSource } from '@/modules/pdf/types/pdf-types';
import { Invoice } from '../entities/invoice.entity';
import { PrismaInvoiceRepository } from '../repositories/invoice.repository';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CreateInvoiceDto } from '../dtos/create-invoice.dto';
import { PdfLayoutService } from '../../pdf/services/layout/pdf-layout.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  private readonly LAYOUT_NAME = 'CEMIG';

  constructor(
    @Inject(PrismaInvoiceRepository)
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly pdfService: PdfService,
    private readonly layoutService: PdfLayoutService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('invoice-processing')
    private readonly invoiceQueue: Queue,
  ) {}

  async processInvoicePdf(
    pdf: PdfSource,
    invoiceId?: string,
  ): Promise<{ jobId: string }> {
    try {
      if (pdf.type === 'buffer' && !this.validatePdfBuffer(pdf.data)) {
        throw new Error('Arquivo inválido: não é um PDF válido');
      }

      if (!this.layoutService.hasLayout(this.LAYOUT_NAME)) {
        throw new Error(`Layout ${this.LAYOUT_NAME} não encontrado`);
      }

      const jobId = invoiceId ? `update-${invoiceId}` : `new-${Date.now()}`;

      const job = await this.invoiceQueue.add(
        'process-invoice',
        {
          pdf,
          invoiceId,
          layoutName: this.LAYOUT_NAME,
        },
        {
          jobId,
        },
      );

      this.logger.debug(`Job criado para processamento de PDF: ${job.id}`);

      return { jobId: job.id.toString() };
    } catch (error) {
      this.logger.error('Erro ao enviar PDF para processamento', error);
      throw error;
    }
  }

  private validatePdfBuffer(data: string | Buffer | number[]): boolean {
    if (typeof data === 'string') {
      return false;
    }
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const header = buffer.toString('ascii', 0, 5);
    return header === '%PDF-';
  }

  async extractInvoiceData(
    pdf: PdfSource,
    invoiceId?: string,
  ): Promise<Invoice> {
    try {
      this.logger.debug('=== Início da extração de dados da fatura ===');
      this.logger.debug(`Tipo de fonte do PDF: ${pdf.type}`);

      if (invoiceId) {
        this.logger.debug(
          `Atualizando status da fatura ${invoiceId} para PROCESSING`,
        );
        await this.invoiceRepository.update(invoiceId, {
          status: InvoiceStatus.PROCESSING,
        });
      }

      this.logger.debug('Obtendo buffer do PDF...');
      const pdfBuffer =
        pdf.type === 'url'
          ? await this.pdfService.getPdfFromStorage(pdf.data as string)
          : Buffer.from(pdf.data as number[]);
      this.logger.debug(`Buffer do PDF obtido: ${pdfBuffer.length} bytes`);

      this.logger.debug('Processando PDF...');
      const result = await this.pdfService.processPdf(
        pdfBuffer,
        `invoice-${invoiceId || 'new'}.pdf`,
        this.LAYOUT_NAME,
        {
          useCache: true,
          validateResult: true,
        },
      );
      this.logger.debug(
        `PDF processado com sucesso. StorageKey: ${result.storageKey}`,
      );
      this.logger.debug(
        `Dados extraídos: ${JSON.stringify(result.extractionResult.data, null, 2)}`,
      );

      const invoiceData = result.extractionResult.data as CreateInvoiceDto;

      let invoice: Invoice;

      if (invoiceId) {
        this.logger.debug(`Atualizando fatura existente ${invoiceId}`);
        invoice = await this.invoiceRepository.update(invoiceId, {
          ...invoiceData,
          pdfUrl: result.storageKey,
          status: InvoiceStatus.COMPLETED,
        });
      } else {
        this.logger.debug('Criando nova fatura');
        invoice = await this.invoiceRepository.create(
          new Invoice({
            ...invoiceData,
            pdfUrl: result.storageKey,
            status: InvoiceStatus.COMPLETED,
          }),
        );

        this.eventEmitter.emit('invoice.created', {
          invoiceId: invoice.id,
          pdf,
        });
      }

      this.logger.debug(`Fatura processada com sucesso: ${invoice.id}`);
      this.eventEmitter.emit('invoice.processed', {
        invoiceId: invoice.id,
        success: true,
      });

      return invoice;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(
        'Erro ao processar fatura:',
        error instanceof Error ? error.stack : String(error),
      );

      if (invoiceId) {
        this.logger.debug(
          `Atualizando status da fatura ${invoiceId} para FAILED`,
        );
        await this.invoiceRepository.update(invoiceId, {
          status: InvoiceStatus.FAILED,
          error: errorMessage,
        });

        this.eventEmitter.emit('invoice.processed', {
          invoiceId,
          success: false,
          error: errorMessage,
        });
      } else {
        this.logger.error('Erro ao processar PDF de novo upload', errorMessage);
      }

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

  async getInvoiceById(id: string): Promise<Invoice | null> {
    return this.invoiceRepository.findById(id);
  }

  async getInvoicePdfUrl(
    invoiceId: string,
    expiresInSeconds?: number,
  ): Promise<string> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Fatura não encontrada');
      }

      if (!invoice.pdfUrl) {
        throw new Error('Fatura não possui PDF associado');
      }

      this.logger.debug(
        `Gerando URL assinada para o PDF da fatura ${invoiceId}`,
      );
      return await this.pdfService.getSignedUrl(
        invoice.pdfUrl,
        expiresInSeconds,
      );
    } catch (error) {
      this.logger.error(
        'Erro ao gerar URL assinada para o PDF da fatura',
        error,
      );
      throw error;
    }
  }

  async updateInvoice(
    invoiceId: string | undefined,
    data: Partial<Invoice>,
  ): Promise<Invoice> {
    try {
      if (invoiceId) {
        const existingInvoice =
          await this.invoiceRepository.findById(invoiceId);
        if (!existingInvoice) {
          throw new Error(`Fatura não encontrada: ${invoiceId}`);
        }
        return await this.invoiceRepository.update(invoiceId, data);
      } else {
        return await this.invoiceRepository.create(data as Invoice);
      }
    } catch (error) {
      this.logger.error('Erro ao atualizar/criar fatura:', error);
      throw error;
    }
  }
}
