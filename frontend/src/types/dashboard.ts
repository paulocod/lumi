export interface ChartDataset {
  [key: string]: string | number;
  date: string;
}

export interface EnergyDataDto {
  electricityConsumption: number;
  compensatedEnergy: number;
  month: string;
}

export interface FinancialDataDto {
  totalWithoutGD: number;
  gdSavings: number;
  month: string;
}

export interface DashboardSummaryDto {
  totalElectricityConsumption: number;
  totalCompensatedEnergy: number;
  totalWithoutGD: number;
  totalGDSavings: number;
  savingsPercentage: number;
}

export interface EnergyChartData extends ChartDataset {
  consumption: number;
  compensated: number;
}

export interface FinancialChartData extends ChartDataset {
  totalWithoutGD: number;
  gdSavings: number;
}

export interface SummaryData {
  totalConsumption: number;
  totalCompensated: number;
  totalValueWithoutGD: number;
  totalGdSavings: number;
  savingsPercentage: number;
} 