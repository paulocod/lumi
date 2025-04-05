import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IInvoiceRepository } from '@/modules/invoice/repositories/invoice.repository.interface';
import { DashboardDataDto, DashboardSummaryDto } from '../dtos/dashboard.dto';
import { PrismaInvoiceRepository } from '@/modules/invoice/repositories/invoice.repository';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @Inject(PrismaInvoiceRepository)
    private readonly invoiceRepository: IInvoiceRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getAllDashboardData(
    clientNumber?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<DashboardDataDto> {
    this.logger.debug(
      `Buscando todos os dados do dashboard para cliente: ${clientNumber || 'todos'}`,
    );

    const cacheKey = `dashboard:all:${clientNumber}:${startDate?.toISOString()}:${endDate?.toISOString()}`;

    const cached = await this.cacheManager.get<DashboardDataDto>(cacheKey);
    if (cached) {
      this.logger.debug('Todos os dados do dashboard encontrados no cache');
      return cached;
    }

    this.logger.debug(
      'Dados do dashboard não encontrados no cache, buscando do banco',
    );

    // Buscar faturas do banco de dados
    const { invoices } = await this.invoiceRepository.findAll({
      clientNumber,
      startDate,
      endDate,
    });

    this.logger.debug(
      `Processando ${invoices.length} faturas para o dashboard`,
    );

    // Processar dados de energia
    const energyData = invoices.map((invoice) => ({
      electricityConsumption:
        invoice.electricityQuantity + invoice.sceeQuantity,
      compensatedEnergy: invoice.compensatedEnergyQuantity,
      month: invoice.referenceMonth,
    }));

    // Processar dados financeiros
    const financialData = invoices.map((invoice) => ({
      totalWithoutGD:
        invoice.electricityValue +
        invoice.sceeValue +
        invoice.publicLightingValue,
      gdSavings: Math.abs(invoice.compensatedEnergyValue),
      month: invoice.referenceMonth,
    }));

    // Calcular resumo
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

    await this.cacheManager.set(cacheKey, data, 1800 * 1000);
    this.logger.debug(
      'Todos os dados do dashboard processados e armazenados no cache',
    );

    return data;
  }
}
