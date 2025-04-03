import { Injectable, Inject } from '@nestjs/common';
import { IInvoiceRepository } from '../invoice/repositories/invoice.repository';
import { EnergyDataDto, FinancialDataDto } from './dto/dashboard.dto';
import { INVOICE_REPOSITORY } from '../invoice/invoice.tokens';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: IInvoiceRepository,
  ) {}

  async getEnergyData(
    clientNumber?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<EnergyDataDto[]> {
    const { invoices } = await this.invoiceRepository.findAll({
      clientNumber,
      startDate,
      endDate,
    });

    return invoices.map((invoice) => ({
      electricityConsumption:
        invoice.electricityQuantity + invoice.sceeQuantity,
      compensatedEnergy: invoice.compensatedEnergyQuantity,
      month: invoice.referenceMonth,
    }));
  }

  async getFinancialData(
    clientNumber?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<FinancialDataDto[]> {
    const { invoices } = await this.invoiceRepository.findAll({
      clientNumber,
      startDate,
      endDate,
    });

    return invoices.map((invoice) => ({
      totalWithoutGD:
        invoice.electricityValue +
        invoice.sceeValue +
        invoice.publicLightingValue,
      gdSavings: Math.abs(invoice.compensatedEnergyValue),
      month: invoice.referenceMonth,
    }));
  }
}
