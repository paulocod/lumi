import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IInvoiceRepository } from '../../../domain/invoice/repositories/invoice.repository';
import { Invoice } from '../../../domain/invoice/entities/invoice.entity';

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
        publicLightingContribution: invoice.publicLightingContribution,
      },
    });

    return new Invoice(createdInvoice);
  }

  async findByClientNumber(clientNumber: string): Promise<Invoice[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: { clientNumber },
      orderBy: { referenceMonth: 'desc' },
    });

    return invoices.map((invoice) => new Invoice(invoice));
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

    return invoice ? new Invoice(invoice) : null;
  }

  async findAll(): Promise<Invoice[]> {
    const invoices = await this.prisma.invoice.findMany({
      orderBy: { referenceMonth: 'desc' },
    });

    return invoices.map((invoice) => new Invoice(invoice));
  }
}
