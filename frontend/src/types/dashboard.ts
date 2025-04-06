export interface EnergyData {
  electricityConsumption: number;
  compensatedEnergy: number;
  month: Date;
  clientNumber?: string;
}

export interface FinancialData {
  totalWithoutGD: number;
  gdSavings: number;
  month: Date;
  clientNumber?: string;
}

export interface DashboardResponse {
  energyData: EnergyData[];
  financialData: FinancialData[];
}

export interface ChartDataset {
  date: string;
  [key: string]: string | number;
}

export interface EnergyChartData extends ChartDataset {
  consumption: number;
  compensated: number;
}

export interface FinancialChartData extends ChartDataset {
  totalWithoutGD: number;
  gdSavings: number;
}

export interface DashboardSummaryDto {
  totalElectricityConsumption: number;
  totalCompensatedEnergy: number;
  totalWithoutGD: number;
  totalGDSavings: number;
  savingsPercentage: number;
}

export interface SummaryData {
  totalConsumption: number;
  totalCompensated: number;
  totalValueWithoutGD: number;
  totalGdSavings: number;
  savingsPercentage: number;
} 