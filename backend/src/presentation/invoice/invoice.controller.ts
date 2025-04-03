import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseDatePipe,
} from '@nestjs/common';
import { InvoiceService } from '../../application/invoice/invoice.service';
import { CreateInvoiceDto } from '../../domain/invoice/dto/create-invoice.dto';
import { Invoice } from '../../domain/invoice/entities/invoice.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova fatura' })
  @ApiResponse({
    status: 201,
    description: 'Fatura criada com sucesso',
    type: Invoice,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    return this.invoiceService.create(createInvoiceDto as Invoice);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as faturas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de faturas',
    type: [Invoice],
  })
  async findAll(): Promise<Invoice[]> {
    return this.invoiceService.findAll();
  }

  @Get('client/:clientNumber')
  @ApiOperation({ summary: 'Buscar faturas por número do cliente' })
  @ApiParam({
    name: 'clientNumber',
    description: 'Número do cliente',
    example: '7005400387',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de faturas do cliente',
    type: [Invoice],
  })
  async findByClientNumber(
    @Param('clientNumber') clientNumber: string,
  ): Promise<Invoice[]> {
    return this.invoiceService.findByClientNumber(clientNumber);
  }

  @Get('client/:clientNumber/month')
  @ApiOperation({ summary: 'Buscar fatura por número do cliente e mês' })
  @ApiParam({
    name: 'clientNumber',
    description: 'Número do cliente',
    example: '7005400387',
  })
  @ApiQuery({
    name: 'month',
    description: 'Mês de referência',
    example: '2024-03-01T00:00:00.000Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Fatura encontrada',
    type: Invoice,
  })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  async findByClientNumberAndMonth(
    @Param('clientNumber') clientNumber: string,
    @Query('month', new ParseDatePipe()) month: Date,
  ): Promise<Invoice | null> {
    return this.invoiceService.findByClientNumberAndMonth(clientNumber, month);
  }
}
