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
import { PrismaService } from 'prisma/prisma.service';
import { LoggerService } from '@/config/logger';
import { PdfStorageService } from '@/modules/pdf/services/storage/pdf-storage.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

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
    private readonly prisma: PrismaService,
    private readonly loggerService: LoggerService,
    private readonly pdfStorageService: PdfStorageService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async processInvoicePdf(
    pdf: PdfSource,
    invoiceId?: string,
    existingObjectName?: string,
  ): Promise<{ jobId: string }> {
    try {
      if (pdf.type === 'buffer' && !this.validatePdfBuffer(pdf.data)) {
        throw new Error('Arquivo inválido: não é um PDF válido');
      }

      if (!this.layoutService.hasLayout(this.LAYOUT_NAME)) {
        throw new Error(`Layout ${this.LAYOUT_NAME} não encontrado`);
      }

      let objectName: string;

      if (existingObjectName) {
        objectName = existingObjectName;

        await this.pdfStorageService.updatePdfInProcessBucket(
          existingObjectName,
          Buffer.from(pdf.data as number[]),
        );

        this.logger.debug(
          `PDF ${existingObjectName} atualizado no bucket de processamento`,
        );
      } else {
        objectName = await this.pdfStorageService.uploadPdfForProcessing(
          Buffer.from(pdf.data as number[]),
          `invoice-${invoiceId || 'new'}.pdf`,
        );
      }

      const jobId = invoiceId ? `update-${invoiceId}` : `new-${Date.now()}`;

      const job = await this.invoiceQueue.add(
        'process-invoice',
        {
          objectName,
          invoiceId,
          layoutName: this.LAYOUT_NAME,
        },
        {
          jobId,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
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

  private async invalidateDashboardCache(): Promise<void> {
    try {
      await this.cacheManager.del('dashboard:all');
      this.logger.debug('Cache do dashboard invalidado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao invalidar cache do dashboard', error);
    }
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

      await this.invalidateDashboardCache();

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

  async downloadInvoicePdf(invoiceId: string): Promise<Buffer> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice) {
        throw new Error('Fatura não encontrada');
      }

      if (!invoice.pdfUrl) {
        throw new Error('Fatura não possui PDF associado');
      }

      this.logger.debug(`Baixando PDF da fatura ${invoiceId}`);

      let objectName = invoice.pdfUrl;
      if (invoice.pdfUrl.includes('/')) {
        const parts = invoice.pdfUrl.split('/');
        objectName = parts[parts.length - 1];

        if (objectName.includes('?')) {
          objectName = objectName.split('?')[0];
        }
      }

      return await this.pdfStorageService.downloadPdf(
        objectName,
        'lumi-processed-invoices',
      );
    } catch (error) {
      this.logger.error(
        'Erro ao baixar PDF da fatura',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  async updateInvoicePdfUrl(invoiceId: string, pdfUrl: string) {
    try {
      let objectName = pdfUrl;
      if (pdfUrl.includes('/')) {
        const parts = pdfUrl.split('/');
        objectName = parts[parts.length - 1];

        if (objectName.includes('?')) {
          objectName = objectName.split('?')[0];
        }
      }

      const invoice = await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          pdfUrl: objectName,
          status: 'COMPLETED',
        },
      });

      this.logger.debug(
        `URL do PDF atualizada com sucesso para a fatura ${invoiceId}`,
      );
      return invoice;
    } catch (error) {
      this.logger.error(
        'Erro ao atualizar URL do PDF da fatura',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  async updateInvoice(invoiceId: string, data: Partial<Invoice>) {
    try {
      const invoice = await this.prisma.invoice.update({
        where: { id: invoiceId },
        data,
      });

      this.logger.debug(`Fatura ${invoiceId} atualizada com sucesso`);
      return invoice;
    } catch (error) {
      this.logger.error(
        'Erro ao atualizar fatura',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }
}
