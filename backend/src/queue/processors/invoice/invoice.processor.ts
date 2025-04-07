import {
  Process,
  Processor,
  OnQueueActive,
  OnQueueError,
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueWaiting,
} from '@nestjs/bull';
import { Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bull';
import { PdfService } from '@/modules/pdf/services/pdf.service';
import { PdfStorageService } from '@/modules/pdf/services/storage/pdf-storage.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { LoggerService } from '@/config/logger';
import { InvoiceService } from '@/modules/invoice/services/invoice.service';

interface InvoiceJobData {
  objectName: string;
  invoiceId?: string;
  layoutName: string;
}

@Processor('invoice-processing')
export class InvoiceQueueProcessor implements OnModuleInit {
  private readonly logger = new Logger(InvoiceQueueProcessor.name);
  private readonly downloadTimeout: number;
  private readonly incomingBucket: string;
  private readonly processedBucket: string;
  private readonly LAYOUT_NAME = 'CEMIG';

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private readonly pdfStorageService: PdfStorageService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly customLogger: LoggerService,
    private readonly invoiceService: InvoiceService,
  ) {
    this.downloadTimeout =
      this.configService.get<number>('pdf.downloadTimeout') || 30000;

    this.incomingBucket =
      this.configService.get<string>('INVOICE_INCOMING_BUCKET') ||
      'incoming-invoices';
    this.processedBucket =
      this.configService.get<string>('INVOICE_PROCESSED_BUCKET') ||
      'processed-invoices';
  }

  onModuleInit() {
    this.logger.log('InvoiceQueueProcessor inicializado');
  }

  @OnQueueWaiting()
  onWaiting(jobId: string) {
    this.logger.debug(`Job ${jobId} aguardando processamento`);
  }

  @OnQueueActive()
  onActive(job: Job<InvoiceJobData>) {
    this.logger.debug(
      `Processando job ${job.id} para fatura: ${job.data.invoiceId || 'nova'}`,
    );
  }

  @OnQueueCompleted()
  onCompleted(job: Job<InvoiceJobData>) {
    this.logger.debug(
      `Job ${job.id} completado com sucesso para fatura: ${job.data.invoiceId || 'nova'}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job<InvoiceJobData>, error: Error) {
    this.logger.error(
      `Job ${job.id} falhou para fatura: ${job.data.invoiceId || 'nova'}`,
      error.stack,
    );
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.error('Erro na fila:', error.stack);
  }

  @Process('process-invoice')
  async processInvoice(job: Job<InvoiceJobData>) {
    try {
      this.logger.debug(
        `Iniciando processamento do PDF ${job.data.objectName}`,
      );

      const pdfBuffer = await this.pdfStorageService.getPdfFromProcessBucket(
        job.data.objectName,
      );

      await this.pdfService.extractData(pdfBuffer, job.data.layoutName, {
        useCache: true,
        validateResult: true,
      });

      const invoice = await this.invoiceService.extractInvoiceData(
        {
          type: 'buffer',
          data: pdfBuffer,
        },
        job.data.invoiceId,
      );

      if (!invoice.id) {
        throw new Error('Fatura criada sem ID');
      }

      await this.pdfStorageService.moveToProcessed(
        job.data.objectName,
        pdfBuffer,
      );

      await this.invoiceService.updateInvoicePdfUrl(
        invoice.id,
        job.data.objectName,
      );

      this.logger.debug(
        `PDF ${job.data.objectName} processado com sucesso. Invoice ID: ${invoice.id}`,
      );

      return {
        status: 'COMPLETED',
        invoiceId: invoice.id,
        pdfUrl: job.data.objectName,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao processar PDF ${job.data.objectName}`,
        error instanceof Error ? error.message : String(error),
      );

      this.logger.debug(
        `Mantendo PDF ${job.data.objectName} no bucket de processamento para reprocessamento futuro`,
      );

      throw error;
    }
  }

  private emitEvent(eventName: string, data: any) {
    this.eventEmitter.emit(eventName, data);
  }
}
