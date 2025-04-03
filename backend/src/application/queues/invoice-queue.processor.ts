/* eslint-disable @typescript-eslint/await-thenable */

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
import { ConfigService } from '@nestjs/config';
import {
  PdfProcessingError,
  QueueProcessingError,
} from '@/shared/errors/application.errors';

interface InvoiceJobData {
  pdf: PdfSource;
  invoiceId: string;
}

@Processor('invoice-processing')
export class InvoiceQueueProcessor implements OnModuleInit {
  private readonly logger = new Logger(InvoiceQueueProcessor.name);
  private readonly downloadTimeout: number;

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    @InjectQueue('invoice-processing')
    private invoiceQueue: Queue<InvoiceJobData>,
  ) {
    this.downloadTimeout =
      this.configService.get<number>('pdf.downloadTimeout') || 30000;
  }

  onModuleInit() {
    this.logger.log('InvoiceQueueProcessor inicializado');
  }

  private emitEvent<T>(eventName: string, payload: T): void {
    try {
      this.eventEmitter.emit(eventName, payload);
    } catch (error) {
      this.logger.error(`Erro ao emitir evento ${eventName}:`, error);
      throw new QueueProcessingError(`Erro ao emitir evento ${eventName}`);
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
      throw new QueueProcessingError('Erro ao criar job de processamento');
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
    console.log('=== Início do Processamento do Job ===');
    console.log('Job data:', {
      jobId: job.id,
      invoiceId: job.data.invoiceId,
      pdfType: job.data.pdf.type,
      pdfDataType: typeof job.data.pdf.data,
      isBuffer: Buffer.isBuffer(job.data.pdf.data),
      isArray: Array.isArray(job.data.pdf.data),
    });

    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: job.data.invoiceId },
      });

      if (!invoice) {
        console.log('Erro: Fatura não encontrada');
        throw new PdfProcessingError(
          `Fatura não encontrada: ${job.data.invoiceId}`,
        );
      }

      await this.prisma.invoice.update({
        where: { id: job.data.invoiceId },
        data: { status: InvoiceStatus.PROCESSING },
      });

      let pdfBuffer: Buffer;
      if (job.data.pdf.type === 'url') {
        console.log('Processando PDF via URL');
        if (typeof job.data.pdf.data !== 'string') {
          throw new PdfProcessingError('URL do PDF deve ser uma string');
        }
        pdfBuffer = await this.downloadPdfFromUrl(job.data.pdf.data);
      } else {
        console.log('Processando PDF via Buffer');
        const bufferData = job.data.pdf.data;
        console.log('Buffer data:', {
          type: typeof bufferData,
          isBuffer: Buffer.isBuffer(bufferData),
          isArray: Array.isArray(bufferData),
        });

        if (Buffer.isBuffer(bufferData)) {
          console.log('Usando buffer existente');
          pdfBuffer = bufferData;
        } else if (Array.isArray(bufferData)) {
          console.log('Convertendo array para buffer');
          pdfBuffer = Buffer.from(bufferData);
        } else {
          console.log('Erro: Buffer inválido');
          throw new PdfProcessingError('O buffer fornecido não é válido');
        }
      }

      console.log('Buffer final:', {
        isBuffer: Buffer.isBuffer(pdfBuffer),
        length: pdfBuffer.length,
        type: typeof pdfBuffer,
      });

      const invoiceData = await this.pdfService.extractInvoiceFromPdf(pdfBuffer);

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

  private async downloadPdfFromUrl(url: string): Promise<Buffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.downloadTimeout,
    );

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new PdfProcessingError(
          `Falha ao baixar o PDF: ${response.statusText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
