import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoiceService } from '../services/invoice.service';
import { InvoiceStatus } from '@/shared/enums/invoice-status.enum';
import { PdfSource } from '@/modules/pdf/types/pdf-types';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { InvoiceResponseDto } from '../dtos/invoice-response.dto';
import { InvoiceStatusResponseDto } from '../dtos/invoice-status-response.dto';
import { InvoiceListResponseDto } from '../dtos/invoice-list-response.dto';
import { InvoiceFilterDto } from '../dtos/invoice-filter.dto';
import { UnprocessedPdfListDto } from '@/modules/pdf/dtos/unprocessed-pdf.dto';
import { PdfStorageService } from '@/modules/pdf/services/storage/pdf-storage.service';

@ApiTags('invoices')
@Controller('invoices')
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);

  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly pdfStorageService: PdfStorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload de fatura em PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo PDF da fatura (máx. 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Fatura enviada para processamento',
    type: InvoiceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou erro no processamento',
  })
  async uploadInvoice(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<InvoiceResponseDto> {
    try {
      this.logger.debug('Iniciando upload de PDF de fatura');

      const pdf: PdfSource = {
        type: 'buffer',
        data: file.buffer,
      };

      const { jobId } = await this.invoiceService.processInvoicePdf(pdf);

      this.logger.debug(`PDF enviado para processamento. JobId: ${jobId}`);

      return {
        message: 'PDF enviado para processamento com sucesso',
        jobId,
      };
    } catch (error) {
      this.logger.error('Erro ao processar upload de PDF', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao processar PDF',
      );
    }
  }

  @Get('unprocessed')
  @ApiOperation({ summary: 'Listar PDFs não processados' })
  @ApiResponse({
    status: 200,
    description: 'Lista de PDFs não processados',
    type: UnprocessedPdfListDto,
  })
  async getUnprocessedPdfs(): Promise<UnprocessedPdfListDto> {
    try {
      this.logger.debug('Buscando lista de PDFs não processados');

      const pdfs = await this.pdfStorageService.listUnprocessedPdfs();

      return {
        pdfs,
        total: pdfs.length,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar lista de PDFs não processados', error);
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Erro ao buscar PDFs não processados',
      );
    }
  }

  @Post('reprocess/:objectName')
  @ApiOperation({ summary: 'Reprocessa um PDF não processado' })
  @ApiResponse({
    status: 200,
    description: 'PDF enviado para reprocessamento com sucesso',
    type: () => InvoiceResponseDto,
  })
  async reprocessUnprocessedPdf(
    @Param('objectName') objectName: string,
  ): Promise<InvoiceResponseDto> {
    try {
      this.logger.debug(`Iniciando reprocessamento do PDF ${objectName}`);

      const pdfBuffer =
        await this.pdfStorageService.getPdfFromProcessBucket(objectName);

      const pdf: PdfSource = {
        type: 'buffer',
        data: pdfBuffer,
      };

      const { jobId } = await this.invoiceService.processInvoicePdf(
        pdf,
        undefined,
        objectName,
      );

      this.logger.debug(
        `PDF ${objectName} enviado para reprocessamento. JobId: ${jobId}`,
      );

      return {
        message: 'PDF enviado para reprocessamento com sucesso',
        jobId,
      };
    } catch (error) {
      this.logger.error(`Erro ao reprocessar PDF ${objectName}`, error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao reprocessar PDF',
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar faturas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de faturas',
    type: InvoiceListResponseDto,
  })
  async getInvoices(
    @Query() filter: InvoiceFilterDto,
  ): Promise<InvoiceListResponseDto> {
    try {
      this.logger.debug('Buscando lista de faturas com filtros', filter);

      const { invoices, total } = await this.invoiceService.findAll(filter);

      return {
        invoices,
        total,
      };
    } catch (error) {
      this.logger.error('Erro ao buscar lista de faturas', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao buscar faturas',
      );
    }
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Status do processamento da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Status atual da fatura',
    type: InvoiceStatusResponseDto,
  })
  async getInvoiceStatus(
    @Param('id') id: string,
  ): Promise<InvoiceStatusResponseDto> {
    try {
      this.logger.debug(`Buscando status da fatura ${id}`);

      const status = await this.invoiceService.getInvoiceStatus(id);
      if (!status) {
        throw new BadRequestException('Fatura não encontrada');
      }

      return {
        status: status.status as InvoiceStatus,
        error: status.error,
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar status da fatura ${id}`, error);
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Erro ao buscar status da fatura',
      );
    }
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download do PDF da fatura' })
  @ApiResponse({
    status: 200,
    description: 'URL do PDF da fatura',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'URL do PDF da fatura',
            },
          },
        },
      },
    },
  })
  async downloadInvoicePdf(@Param('id') id: string): Promise<{ url: string }> {
    try {
      this.logger.debug(`Iniciando download do PDF da fatura ${id}`);

      const invoice = await this.invoiceService.getInvoiceById(id);
      if (!invoice) {
        throw new BadRequestException('Fatura não encontrada');
      }

      if (!invoice.pdfUrl) {
        throw new BadRequestException('Fatura não possui PDF associado');
      }

      return { url: invoice.pdfUrl };
    } catch (error) {
      this.logger.error(`Erro ao baixar PDF da fatura ${id}`, error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao baixar PDF da fatura',
      );
    }
  }
}
