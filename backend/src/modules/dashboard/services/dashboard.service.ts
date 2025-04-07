import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IInvoiceRepository } from '@/modules/invoice/repositories/invoice.repository.interface';
import {
  DashboardDataDto,
  DashboardSummaryDto,
  EnergyDataDto,
  FinancialDataDto,
} from '../dtos/dashboard.dto';
import { PrismaInvoiceRepository } from '@/modules/invoice/repositories/invoice.repository';
import { InvoiceStatus } from '@/shared/enums/invoice-status.enum';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @Inject(PrismaInvoiceRepository)
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getAllDashboardData(clientNumber?: string): Promise<DashboardDataDto> {
    this.logger.debug(
      `Buscando todos os dados do dashboard para cliente: ${clientNumber || 'todos'}`,
    );

    const cacheKey = `dashboard:all:${clientNumber || 'all'}`;
    const cachedData = await this.cacheManager.get<DashboardDataDto>(cacheKey);

    if (cachedData) {
      this.logger.debug(
        `Dados do dashboard encontrados no cache para ${cacheKey}`,
      );
      return cachedData;
    }

    this.logger.debug(
      `Dados do dashboard não encontrados no cache para ${cacheKey}, buscando do banco de dados`,
    );

    const { invoices } = await this.invoiceRepository.findAll({
      clientNumber,
      status: InvoiceStatus.COMPLETED,
    });

    this.logger.debug(
      `Processando ${invoices.length} faturas para o dashboard`,
    );

    const energyDataMap = new Map<string, EnergyDataDto>();
    invoices.forEach((invoice) => {
      const monthKey = invoice.referenceMonth.toISOString().substring(0, 10);
      const currentData = energyDataMap.get(monthKey) || {
        electricityConsumption: 0,
        compensatedEnergy: 0,
        month: invoice.referenceMonth,
        clientNumber: invoice.clientNumber,
      };

      energyDataMap.set(monthKey, {
        electricityConsumption:
          currentData.electricityConsumption +
          invoice.electricityQuantity +
          invoice.sceeQuantity,
        compensatedEnergy:
          currentData.compensatedEnergy + invoice.compensatedEnergyQuantity,
        month: invoice.referenceMonth,
        clientNumber: invoice.clientNumber,
      });
    });
    const energyData = Array.from(energyDataMap.values());

    const financialDataMap = new Map<string, FinancialDataDto>();
    invoices.forEach((invoice) => {
      const monthKey = invoice.referenceMonth.toISOString().substring(0, 10);
      const currentData = financialDataMap.get(monthKey) || {
        totalWithoutGD: 0,
        gdSavings: 0,
        month: invoice.referenceMonth,
        clientNumber: invoice.clientNumber,
      };

      financialDataMap.set(monthKey, {
        totalWithoutGD:
          currentData.totalWithoutGD +
          invoice.electricityValue +
          invoice.sceeValue +
          invoice.publicLightingValue,
        gdSavings:
          currentData.gdSavings + Math.abs(invoice.compensatedEnergyValue),
        month: invoice.referenceMonth,
        clientNumber: invoice.clientNumber,
      });
    });
    const financialData = Array.from(financialDataMap.values());

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

    const summary: DashboardSummaryDto = {
      clientNumber: clientNumber || 'Todos os clientes',
      totalElectricityConsumption,
      totalCompensatedEnergy,
      totalWithoutGD,
      totalGDSavings,
      savingsPercentage: Number(savingsPercentage.toFixed(2)),
    };

    const data: DashboardDataDto = {
      energyData,
      financialData,
      summary,
    };

    await this.cacheManager.set(cacheKey, data, 3600); // TTL de 1 hora
    this.logger.debug(`Dados do dashboard salvos no cache para ${cacheKey}`);

    return data;
  }

  async invalidateDashboardCache(clientNumber?: string): Promise<void> {
    const cacheKey = `dashboard:all:${clientNumber || 'all'}`;
    await this.cacheManager.del(cacheKey);
    this.logger.debug(`Cache do dashboard invalidado para ${cacheKey}`);
  }
}
