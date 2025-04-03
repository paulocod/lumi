import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseDatePipe,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InvoiceService } from '../../application/services/invoice.service';
import { Invoice } from '../../domain/invoice/entities/invoice.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadInvoiceUrlDto } from '@/domain/invoice/dto/upload-invoice.dto';
import { PdfSource } from '@/domain/pdf/types/pdf-types';

@ApiTags('invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload de fatura via URL' })
  @ApiBody({ type: UploadInvoiceUrlDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Fatura criada com sucesso',
    type: Invoice,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'URL inválida ou PDF não encontrado',
  })
  @HttpCode(HttpStatus.CREATED)
  async uploadInvoiceUrl(@Body() dto: UploadInvoiceUrlDto) {
    const pdfSource: PdfSource = {
      type: 'url',
      data: dto.url,
    };
    return this.invoiceService.uploadInvoice(pdfSource);
  }

  @Post('upload/buffer')
  @ApiOperation({ summary: 'Upload de fatura via arquivo PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo PDF da fatura',
          example: 'fatura.pdf',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Fatura criada com sucesso',
    type: Invoice,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Arquivo inválido ou não é um PDF',
  })
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadInvoiceBuffer(@UploadedFile() file: Express.Multer.File) {
    console.log('=== Início do Upload de Buffer ===');
    console.log('File recebido:', {
      filename: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      bufferType: file?.buffer ? typeof file.buffer : 'undefined',
      isBuffer: file?.buffer ? Buffer.isBuffer(file.buffer) : false,
    });

    if (!file || !file.buffer) {
      console.log('Erro: Nenhum arquivo ou buffer recebido');
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    if (file.mimetype !== 'application/pdf') {
      console.log('Erro: Tipo de arquivo inválido:', file.mimetype);
      throw new BadRequestException('O arquivo deve ser um PDF');
    }

    if (!Buffer.isBuffer(file.buffer)) {
      console.log('Erro: Buffer inválido');
      throw new BadRequestException('O buffer do arquivo não é válido');
    }

    console.log('Buffer válido, criando PdfSource');
    const pdfSource: PdfSource = {
      type: 'buffer',
      data: file.buffer,
    };
    console.log('PdfSource criado:', {
      type: pdfSource.type,
      dataType: typeof pdfSource.data,
      isBuffer: Buffer.isBuffer(pdfSource.data),
    });

    return this.invoiceService.uploadInvoice(pdfSource);
  }

  @Get('status/:invoiceId')
  @ApiOperation({ summary: 'Buscar status de processamento da fatura' })
  @ApiParam({
    name: 'invoiceId',
    description: 'ID da fatura',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Status da fatura',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string' },
        error: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  async getInvoiceStatus(@Param('invoiceId') invoiceId: string) {
    const status = await this.invoiceService.getInvoiceStatus(invoiceId);
    if (!status) {
      throw new NotFoundException(`Fatura não encontrada: ${invoiceId}`);
    }
    return status;
  }

  @Get()
  @ApiOperation({ summary: 'Listar faturas com filtros' })
  @ApiQuery({
    name: 'clientNumber',
    required: false,
    description: 'Filtrar por número do cliente',
    example: '7005400387',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Filtrar por mês específico',
    example: '2024-03-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Data inicial para filtro de período',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Data final para filtro de período',
    example: '2024-12-31T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página para paginação',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Quantidade de itens por página',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de faturas com total',
    schema: {
      type: 'object',
      properties: {
        invoices: {
          type: 'array',
          items: { $ref: '#/components/schemas/Invoice' },
        },
        total: { type: 'number' },
      },
    },
  })
  async findAll(
    @Query('clientNumber') clientNumber?: string,
    @Query('month', new ParseDatePipe({ optional: true })) month?: Date,
    @Query('startDate', new ParseDatePipe({ optional: true })) startDate?: Date,
    @Query('endDate', new ParseDatePipe({ optional: true })) endDate?: Date,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ invoices: Invoice[]; total: number }> {
    return this.invoiceService.findAll({
      clientNumber,
      month,
      startDate,
      endDate,
      page,
      limit,
    });
  }
}
