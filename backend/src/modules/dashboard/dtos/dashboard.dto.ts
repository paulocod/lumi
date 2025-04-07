import { ApiProperty } from '@nestjs/swagger';

export class EnergyDataDto {
  @ApiProperty({
    description: 'Número do cliente',
    example: '7005400387',
  })
  clientNumber: string;

  @ApiProperty({
    description: 'Consumo de Energia Elétrica (kWh)',
    example: 526,
  })
  electricityConsumption: number;

  @ApiProperty({
    description: 'Energia Compensada (kWh)',
    example: 476,
  })
  compensatedEnergy: number;

  @ApiProperty({
    description: 'Mês de referência',
    example: '2024-03-01T00:00:00.000Z',
  })
  month: Date;
}

export class FinancialDataDto {
  @ApiProperty({
    description: 'Número do cliente',
    example: '7005400387',
  })
  clientNumber: string;

  @ApiProperty({
    description: 'Valor Total sem GD (R$)',
    example: 502.35,
  })
  totalWithoutGD: number;

  @ApiProperty({
    description: 'Economia GD (R$)',
    example: 225.42,
  })
  gdSavings: number;

  @ApiProperty({
    description: 'Mês de referência',
    example: '2024-03-01T00:00:00.000Z',
  })
  month: Date;
}

export class DashboardSummaryDto {
  @ApiProperty({
    description: 'Número do cliente',
    example: '7005400387',
  })
  clientNumber: string;

  @ApiProperty({
    description: 'Total de consumo de energia elétrica (kWh)',
    example: 5260,
  })
  totalElectricityConsumption: number;

  @ApiProperty({
    description: 'Total de energia compensada (kWh)',
    example: 4760,
  })
  totalCompensatedEnergy: number;

  @ApiProperty({
    description: 'Total gasto sem GD (R$)',
    example: 5023.5,
  })
  totalWithoutGD: number;

  @ApiProperty({
    description: 'Total de economia com GD (R$)',
    example: 2254.2,
  })
  totalGDSavings: number;

  @ApiProperty({
    description: 'Percentual de economia com GD',
    example: 44.87,
  })
  savingsPercentage: number;
}

export class DashboardDataDto {
  @ApiProperty({
    description: 'Dados de consumo de energia por mês',
    type: [EnergyDataDto],
  })
  energyData: EnergyDataDto[];

  @ApiProperty({
    description: 'Dados financeiros por mês',
    type: [FinancialDataDto],
  })
  financialData: FinancialDataDto[];

  @ApiProperty({
    description: 'Resumo geral dos dados',
    type: DashboardSummaryDto,
  })
  summary: DashboardSummaryDto;
}
