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

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    return this.invoiceService.create(createInvoiceDto as Invoice);
  }

  @Get()
  async findAll(): Promise<Invoice[]> {
    return this.invoiceService.findAll();
  }

  @Get('client/:clientNumber')
  async findByClientNumber(
    @Param('clientNumber') clientNumber: string,
  ): Promise<Invoice[]> {
    return this.invoiceService.findByClientNumber(clientNumber);
  }

  @Get('client/:clientNumber/month')
  async findByClientNumberAndMonth(
    @Param('clientNumber') clientNumber: string,
    @Query('month', new ParseDatePipe()) month: Date,
  ): Promise<Invoice | null> {
    return this.invoiceService.findByClientNumberAndMonth(clientNumber, month);
  }
}
