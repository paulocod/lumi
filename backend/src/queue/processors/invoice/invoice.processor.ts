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
import { PdfProcessingError } from '@/shared/errors/application.errors';
import { PrismaService } from 'prisma/prisma.service';
import { LoggerService } from '@/config/logger';
import { InvoiceService } from '@/modules/invoice/services/invoice.service';
import { PdfSource } from '@/modules/pdf/types/pdf-types';
import { Invoice } from '@/modules/invoice/entities/invoice.entity';
import { InvoiceStatus } from '@/shared/enums/invoice-status.enum';

interface InvoiceJobData {
  pdf: PdfSource;
  invoiceId?: string;
  layoutName: string;
}

@Processor('invoice-processing')
export class InvoiceQueueProcessor implements OnModuleInit {
  private readonly logger = new Logger(InvoiceQueueProcessor.name);
  private readonly downloadTimeout: number;
  private readonly incomingBucket: string;
  private readonly processedBucket: string;

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
  async handleInvoiceProcessing(job: Job<InvoiceJobData>) {
    this.customLogger.debug('=== Início do Processamento do Job ===');

    try {
      let pdfBuffer: Buffer;
      let processedPdfKey: string | undefined;

      // 1. Se o PDF já estiver em um bucket, mova-o para o bucket de processados
      if (job.data.pdf.type === 'bucket' && job.data.pdf.key) {
        processedPdfKey = await this.pdfStorageService.movePdfBetweenBuckets(
          job.data.pdf.key,
          this.incomingBucket,
          this.processedBucket,
          `${job.data.invoiceId || Date.now()}-${job.data.pdf.key}`,
        );
        pdfBuffer = await this.pdfStorageService.downloadPdf(
          processedPdfKey,
          this.processedBucket,
        );
      } else if (job.data.pdf.type === 'buffer') {
        if (Buffer.isBuffer(job.data.pdf.data)) {
          pdfBuffer = job.data.pdf.data;
        } else if (typeof job.data.pdf.data === 'string') {
          pdfBuffer = Buffer.from(job.data.pdf.data, 'utf-8');
        } else {
          pdfBuffer = Buffer.from(job.data.pdf.data);
        }

        // Upload do PDF para o bucket de processados
        processedPdfKey = await this.pdfStorageService.uploadPdf(
          pdfBuffer,
          `invoice-${job.data.invoiceId || Date.now()}.pdf`,
          this.processedBucket,
        );
      } else {
        throw new Error('Tipo de PDF não suportado');
      }

      // 2. Extrair dados do PDF
      const extractionResult = await this.pdfService.extractData<
        Partial<Invoice>
      >(pdfBuffer, job.data.layoutName, {
        useCache: true,
        validateResult: true,
      });

      // 3. Atualizar ou criar a fatura com os dados extraídos
      const invoice = await this.invoiceService.updateInvoice(
        job.data.invoiceId,
        {
          ...extractionResult.data,
          pdfUrl: processedPdfKey,
          status: InvoiceStatus.COMPLETED,
        },
      );

      this.emitEvent('invoice.processed', {
        invoiceId: invoice.id,
        status: invoice.status,
      });

      return invoice;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error('Erro no processamento da fatura:', errorMessage);
      throw new PdfProcessingError(errorMessage);
    }
  }

  private emitEvent(eventName: string, data: any) {
    this.eventEmitter.emit(eventName, data);
  }
}
