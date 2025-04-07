import { Injectable } from '@nestjs/common';
import { IInvoiceRepository } from './invoice.repository.interface';
import { Prisma } from '@prisma/client';
import { InvoiceStatus } from '@/shared/enums/invoice-status.enum';
import { PrismaService } from 'prisma/prisma.service';
import { Invoice } from '../entities/invoice.entity';

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
        status: invoice.status || InvoiceStatus.COMPLETED,
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
    month?: Date;
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
  }): Promise<{ invoices: Invoice[]; total: number }> {
    const where: Prisma.InvoiceWhereInput = {};

    if (filters?.clientNumber) {
      where.clientNumber = filters.clientNumber;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.month) {
      where.referenceMonth = filters.month;
    } else if (filters?.startDate || filters?.endDate) {
      where.referenceMonth = {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      };
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { referenceMonth: 'asc' },
        skip: filters?.page
          ? (filters.page - 1) * (filters.limit || 10)
          : undefined,
        take: filters?.limit || 10,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      invoices: invoices.map((invoice) => this.mapToInvoice(invoice)),
      total,
    };
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

  async update(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    return this.mapToInvoice(updatedInvoice);
  }

  async findById(id: string): Promise<Invoice | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    return invoice ? this.mapToInvoice(invoice) : null;
  }

  private mapToInvoice(data: InvoiceWithRelations): Invoice {
    return new Invoice({
      id: data.id,
      clientNumber: data.clientNumber,
      referenceMonth: data.referenceMonth,
      electricityQuantity: data.electricityQuantity,
      electricityValue: data.electricityValue,
      sceeQuantity: data.sceeQuantity,
      sceeValue: data.sceeValue,
      compensatedEnergyQuantity: data.compensatedEnergyQuantity,
      compensatedEnergyValue: data.compensatedEnergyValue,
      publicLightingValue: data.publicLightingValue,
      pdfUrl: data.pdfUrl || undefined,
      status: data.status as InvoiceStatus,
      error: typeof data.error === 'string' ? data.error : undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
