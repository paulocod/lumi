/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Process,
  Processor,
  OnQueueActive,
  OnQueueError,
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueWaiting,
  InjectQueue,
} from '@nestjs/bull';
import { Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnEvent } from '@nestjs/event-emitter';
import { Job, Queue } from 'bull';
import { PrismaService } from '@/prisma/prisma.service';
import { InvoiceStatus } from '@/domain/invoice/entities/invoice.entity';
import {
  InvoiceCreatedEvent,
  InvoiceProcessedEvent,
  PdfSource,
} from '@/shared/events/invoice.events';
import { PdfService } from '@/domain/pdf/pdf.service';

interface InvoiceJobData {
  pdf: PdfSource;
  invoiceId: string;
}

@Processor('invoice-processing')
export class InvoiceQueueProcessor implements OnModuleInit {
  private readonly logger = new Logger(InvoiceQueueProcessor.name);
  private readonly PDF_DOWNLOAD_TIMEOUT = 30000;

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('invoice-processing')
    private invoiceQueue: Queue<InvoiceJobData>,
  ) {
    this.logger.log('InvoiceQueueProcessor construído');
  }

  async onModuleInit() {
    this.logger.log('InvoiceQueueProcessor inicializado');
    this.logger.debug('Configuração do processador:', {
      name: 'invoice-processing',
      processName: 'process-invoice',
    });

    try {
      const workers = await this.invoiceQueue.getWorkers();
      this.logger.debug(`Número de workers: ${workers.length}`);
      workers.forEach((worker) => {
        this.logger.debug(`Worker: ${worker.id}`);
      });
    } catch (error) {
      this.logger.error(
        'Erro ao verificar workers:',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  private emitEvent<T>(eventName: string, payload: T): void {
    try {
      this.eventEmitter.emit(eventName, payload);
    } catch (error) {
      this.logger.error(`Erro ao emitir evento ${eventName}:`, error);
      throw error;
    }
  }

  @OnEvent('invoice.created')
  async handleInvoiceCreated(event: InvoiceCreatedEvent) {
    this.logger.debug(
      `Recebido evento invoice.created para fatura: ${event.invoiceId}`,
    );

    try {
      const job = await this.invoiceQueue.add('process-invoice', {
        pdf: event.pdf,
        invoiceId: event.invoiceId,
      });

      this.logger.debug(
        `Job criado para fatura: ${event.invoiceId}, jobId: ${job.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao criar job para fatura: ${event.invoiceId}`,
        error,
      );
      throw error;
    }
  }

  @OnQueueWaiting()
  onWaiting(jobId: string) {
    this.logger.debug(`Job ${jobId} aguardando processamento`);
  }

  @OnQueueActive()
  onActive(job: Job<InvoiceJobData>) {
    this.logger.debug(
      `Processando job ${job.id} para fatura: ${job.data.invoiceId}`,
    );
    this.logger.debug('Dados do job:', {
      id: job.id,
      name: job.name,
      data: job.data,
      timestamp: job.timestamp,
      attempts: job.attemptsMade,
    });
  }

  @OnQueueCompleted()
  onCompleted(job: Job<InvoiceJobData>) {
    this.logger.debug(
      `Job ${job.id} completado com sucesso para fatura: ${job.data.invoiceId}`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job<InvoiceJobData>, error: Error) {
    this.logger.error(
      `Job ${job.id} falhou para fatura: ${job.data.invoiceId}`,
      error.stack,
    );
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.error('Erro na fila:', error.stack);
  }

  @Process('process-invoice')
  async handleInvoiceProcessing(job: Job<InvoiceJobData>) {
    this.logger.log(
      `Iniciando processamento do job ${job.id} para fatura: ${job.data.invoiceId}`,
    );
    this.logger.debug('Dados do job:', {
      id: job.id,
      invoiceId: job.data.invoiceId,
      pdfType: job.data.pdf.type,
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
    });

    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: job.data.invoiceId },
      });

      if (!invoice) {
        this.logger.error(`Fatura não encontrada: ${job.data.invoiceId}`);
        throw new Error(`Fatura não encontrada: ${job.data.invoiceId}`);
      }

      this.logger.debug(`Status atual da fatura: ${invoice.status}`);
      this.logger.debug(
        `Atualizando status da fatura para PROCESSING: ${job.data.invoiceId}`,
      );
      await this.prisma.invoice.update({
        where: { id: job.data.invoiceId },
        data: { status: InvoiceStatus.PROCESSING },
      });

      let pdfBuffer: Buffer;
      if (job.data.pdf.type === 'url') {
        this.logger.debug(`Baixando PDF da URL: ${job.data.pdf.data}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.PDF_DOWNLOAD_TIMEOUT,
        );

        try {
          const response = await fetch(job.data.pdf.data, {
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error(`Falha ao baixar o PDF: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          pdfBuffer = Buffer.from(arrayBuffer);
        } finally {
          clearTimeout(timeoutId);
        }
      } else {
        pdfBuffer = job.data.pdf.data;
      }

      this.logger.debug('Extraindo dados da fatura');
      const invoiceData =
        await this.pdfService.extractInvoiceFromPdf(pdfBuffer);

      this.logger.debug('Dados extraídos:', invoiceData);
      await this.prisma.invoice.update({
        where: { id: job.data.invoiceId },
        data: {
          ...invoiceData,
          status: InvoiceStatus.PROCESSED,
        },
      });

      const event: InvoiceProcessedEvent = {
        invoiceId: job.data.invoiceId,
        success: true,
      };
      this.emitEvent('invoice.processed', event);

      this.logger.log(
        `Job ${job.id} processado com sucesso para fatura: ${job.data.invoiceId}`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao processar job ${job.id} para fatura: ${job.data.invoiceId}`,
        error instanceof Error ? error.stack : error,
      );

      await this.prisma.invoice.update({
        where: { id: job.data.invoiceId },
        data: {
          status: InvoiceStatus.ERROR,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      });

      const event: InvoiceProcessedEvent = {
        invoiceId: job.data.invoiceId,
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
      await this.emitEvent('invoice.processed', event);

      throw error;
    }
  }
}
