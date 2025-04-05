export interface Invoice {
  id: string;
  clientNumber: string;
  consumptionDate: string;
  totalConsumption: number;
  compensatedEnergy: number;
  totalValueWithoutGD: number;
  gdSavings: number;
  pdfUrl: string;
}

export interface InvoiceFilters {
  clientNumber?: string;
  startDate?: string;
  endDate?: string;
}

export interface DashboardData {
  energyConsumption: {
    date: string;
    consumption: number;
    compensated: number;
  }[];
  financialData: {
    date: string;
    totalWithoutGD: number;
    gdSavings: number;
  }[];
  summary: {
    totalConsumption: number;
    totalCompensated: number;
    totalValueWithoutGD: number;
    totalGdSavings: number;
  };
}
