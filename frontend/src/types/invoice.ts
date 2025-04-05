export interface Invoice {
  id: string;
  clientNumber: string;
  referenceMonth: string;
  electricityQuantity: number;
  electricityValue: number;
  sceeQuantity: number;
  sceeValue: number;
  compensatedEnergyQuantity: number;
  compensatedEnergyValue: number;
  publicLightingValue: number;
  pdfUrl?: string;
  status: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFilters {
  clientNumber?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
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

export interface PaginatedInvoiceResponse {
  invoices: Invoice[];
  total: number;
}
