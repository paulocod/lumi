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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvoiceResponseDto } from '../dtos/invoice-response.dto';
import { InvoiceStatusResponseDto } from '../dtos/invoice-status-response.dto';
import { InvoiceListResponseDto } from '../dtos/invoice-list-response.dto';
import { InvoicePdfUrlResponseDto } from '../dtos/invoice-pdf-url-response.dto';
import { InvoiceFilterDto } from '../dtos/invoice-filter.dto';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);

  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload de PDF de fatura' })
  @ApiResponse({
    status: 201,
    description: 'PDF enviado para processamento com sucesso',
    type: () => InvoiceResponseDto,
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

  @Post(':id/reprocess')
  @ApiOperation({ summary: 'Reprocessa uma fatura existente' })
  @ApiResponse({
    status: 200,
    description: 'Fatura enviada para reprocessamento com sucesso',
    type: () => InvoiceResponseDto,
  })
  async reprocessInvoice(@Param('id') id: string): Promise<InvoiceResponseDto> {
    try {
      this.logger.debug(`Iniciando reprocessamento da fatura ${id}`);

      const invoice = await this.invoiceService.getInvoiceById(id);
      if (!invoice) {
        throw new BadRequestException('Fatura não encontrada');
      }

      if (!invoice.pdfUrl) {
        throw new BadRequestException(
          'Fatura não possui PDF associado para reprocessamento',
        );
      }

      const pdf: PdfSource = {
        type: 'url',
        data: invoice.pdfUrl,
      };

      const { jobId } = await this.invoiceService.processInvoicePdf(pdf, id);

      this.logger.debug(
        `Fatura ${id} enviada para reprocessamento. JobId: ${jobId}`,
      );

      return {
        message: 'Fatura enviada para reprocessamento com sucesso',
        jobId,
      };
    } catch (error) {
      this.logger.error(`Erro ao reprocessar fatura ${id}`, error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao reprocessar fatura',
      );
    }
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Obtém o status de processamento de uma fatura' })
  @ApiResponse({
    status: 200,
    description: 'Status da fatura obtido com sucesso',
    type: () => InvoiceStatusResponseDto,
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

  @Get()
  @ApiOperation({ summary: 'Lista faturas com filtros opcionais' })
  @ApiResponse({
    status: 200,
    description: 'Lista de faturas obtida com sucesso',
    type: () => InvoiceListResponseDto,
  })
  async listInvoices(
    @Query() filters: InvoiceFilterDto,
  ): Promise<InvoiceListResponseDto> {
    try {
      this.logger.debug('Buscando lista de faturas com filtros', filters);

      const { invoices, total } = await this.invoiceService.findAll(filters);

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

  @Get(':id/pdf-url')
  @ApiOperation({ summary: 'Obtém URL assinada para o PDF da fatura' })
  @ApiResponse({
    status: 200,
    description: 'URL do PDF obtida com sucesso',
    type: () => InvoicePdfUrlResponseDto,
  })
  async getInvoicePdfUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: number,
  ): Promise<InvoicePdfUrlResponseDto> {
    try {
      this.logger.debug(`Gerando URL assinada para PDF da fatura ${id}`);

      const url = await this.invoiceService.getInvoicePdfUrl(id, expiresIn);

      return {
        url,
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar URL do PDF da fatura ${id}`, error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Erro ao gerar URL do PDF',
      );
    }
  }
}
