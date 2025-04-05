import { Injectable, Inject } from '@nestjs/common';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IInvoiceRepository } from '@/modules/invoice/repositories/invoice.repository.interface';
import {
  DashboardSummaryDto,
  EnergyDataDto,
  FinancialDataDto,
} from '../dtos/dashboard.dto';
import { PrismaInvoiceRepository } from '@/modules/invoice/repositories/invoice.repository';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(PrismaInvoiceRepository)
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getEnergyData(
    clientNumber?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<EnergyDataDto[]> {
    const cacheKey = `dashboard:energy:${clientNumber}:${startDate?.toISOString()}:${endDate?.toISOString()}`;

    const cached = await this.cacheManager.get<EnergyDataDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const { invoices } = await this.invoiceRepository.findAll({
      clientNumber,
      startDate,
      endDate,
    });

    const data = invoices.map((invoice) => ({
      electricityConsumption:
        invoice.electricityQuantity + invoice.sceeQuantity,
      compensatedEnergy: invoice.compensatedEnergyQuantity,
      month: invoice.referenceMonth,
    }));

    await this.cacheManager.set(cacheKey, data, 1800 * 1000);

    return data;
  }

  async getFinancialData(
    clientNumber?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<FinancialDataDto[]> {
    const cacheKey = `dashboard:financial:${clientNumber}:${startDate?.toISOString()}:${endDate?.toISOString()}`;

    const cached = await this.cacheManager.get<FinancialDataDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const { invoices } = await this.invoiceRepository.findAll({
      clientNumber,
      startDate,
      endDate,
    });

    const data = invoices.map((invoice) => ({
      totalWithoutGD:
        invoice.electricityValue +
        invoice.sceeValue +
        invoice.publicLightingValue,
      gdSavings: Math.abs(invoice.compensatedEnergyValue),
      month: invoice.referenceMonth,
    }));

    await this.cacheManager.set(cacheKey, data, 1800 * 1000);

    return data;
  }

  async getSummary(
    clientNumber?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<DashboardSummaryDto> {
    const cacheKey = `dashboard:summary:${clientNumber}:${startDate?.toISOString()}:${endDate?.toISOString()}`;

    const cached = await this.cacheManager.get<DashboardSummaryDto>(cacheKey);
    if (cached) {
      return cached;
    }

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

    const data = {
      totalElectricityConsumption,
      totalCompensatedEnergy,
      totalWithoutGD,
      totalGDSavings,
      savingsPercentage: Number(savingsPercentage.toFixed(2)),
    };

    await this.cacheManager.set(cacheKey, data, 1800 * 1000);

    return data;
  }
}
