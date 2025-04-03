import { Injectable, Inject } from '@nestjs/common';
import { IInvoiceRepository } from '../../domain/invoice/repositories/invoice.repository';
import {
  EnergyDataDto,
  FinancialDataDto,
  DashboardSummaryDto,
} from './dto/dashboard.dto';
import { INVOICE_REPOSITORY } from '../../domain/invoice/invoice.tokens';

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

  async getSummary(
    clientNumber?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<DashboardSummaryDto> {
    const { invoices } = await this.invoiceRepository.findAll({
      clientNumber,
      startDate,
      endDate,
    });

    const totalElectricityConsumption = invoices.reduce(
      (acc, invoice) =>
        acc + invoice.electricityQuantity + invoice.sceeQuantity,
      0,
    );

    const totalCompensatedEnergy = invoices.reduce(
      (acc, invoice) => acc + invoice.compensatedEnergyQuantity,
      0,
    );

    const totalWithoutGD = invoices.reduce(
      (acc, invoice) =>
        acc +
        invoice.electricityValue +
        invoice.sceeValue +
        invoice.publicLightingValue,
      0,
    );

    const totalGDSavings = invoices.reduce(
      (acc, invoice) => acc + Math.abs(invoice.compensatedEnergyValue),
      0,
    );

    const savingsPercentage =
      totalWithoutGD > 0 ? (totalGDSavings / totalWithoutGD) * 100 : 0;

    return {
      totalElectricityConsumption,
      totalCompensatedEnergy,
      totalWithoutGD,
      totalGDSavings,
      savingsPercentage: Number(savingsPercentage.toFixed(2)),
    };
  }
}
