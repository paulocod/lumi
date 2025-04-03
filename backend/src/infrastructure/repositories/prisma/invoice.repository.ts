import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IInvoiceRepository } from '../../../domain/invoice/repositories/invoice.repository';
import {
  Invoice,
  InvoiceStatus,
} from '../../../domain/invoice/entities/invoice.entity';
import { Prisma } from '@prisma/client';

type InvoiceWithRelations = Prisma.InvoiceGetPayload<Record<string, never>>;

@Injectable()
export class PrismaInvoiceRepository implements IInvoiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(invoice: Invoice): Promise<Invoice> {
    const createdInvoice = await this.prisma.invoice.create({
      data: {
        clientNumber: invoice.clientNumber,
        referenceMonth: invoice.referenceMonth,
        electricityQuantity: invoice.electricityQuantity,
        electricityValue: invoice.electricityValue,
        sceeQuantity: invoice.sceeQuantity,
        sceeValue: invoice.sceeValue,
        compensatedEnergyQuantity: invoice.compensatedEnergyQuantity,
        compensatedEnergyValue: invoice.compensatedEnergyValue,
        publicLightingValue: invoice.publicLightingValue,
        pdfUrl: invoice.pdfUrl || null,
        status: invoice.status || InvoiceStatus.PROCESSED,
      },
    });

    return this.mapToInvoice(createdInvoice);
  }

  async findByClientNumber(clientNumber: string): Promise<Invoice[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: { clientNumber },
      orderBy: { referenceMonth: 'desc' },
    });

    return invoices.map((invoice) => this.mapToInvoice(invoice));
  }

  async findByClientNumberAndMonth(
    clientNumber: string,
    month: Date,
  ): Promise<Invoice | null> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        clientNumber,
        referenceMonth: month,
      },
    });

    return invoice ? this.mapToInvoice(invoice) : null;
  }

  async findAll(filters?: {
    clientNumber?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Invoice[]> {
    const where: Prisma.InvoiceWhereInput = {};

    if (filters?.clientNumber) {
      where.clientNumber = filters.clientNumber;
    }

    if (filters?.startDate || filters?.endDate) {
      where.referenceMonth = {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      };
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: { referenceMonth: 'desc' },
    });

    return invoices.map((invoice) => this.mapToInvoice(invoice));
  }

  async findByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: { status },
      orderBy: { referenceMonth: 'desc' },
    });

    return invoices.map((invoice) => this.mapToInvoice(invoice));
  }

  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: { status },
    });

    return this.mapToInvoice(updatedInvoice);
  }

  private mapToInvoice(data: InvoiceWithRelations): Invoice {
    // @ts-expect-error - Ignorando erro de tipo para pdfUrl
    return new Invoice({
      ...data,
      status: data.status as InvoiceStatus,
    });
  }
}
