export type InvoiceStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';

export interface Invoice {
  id: string;
  clientNumber: string;
  referenceMonth: Date;
  electricityQuantity: number;
  electricityValue: number;
  sceeQuantity: number;
  sceeValue: number;
  compensatedEnergyQuantity: number;
  compensatedEnergyValue: number;
  publicLightingValue: number;
  pdfUrl?: string;
  status: InvoiceStatus;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InvoiceFilters {
  clientNumber?: string;
  startDate?: Date;
  endDate?: Date;
  month?: Date;
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

export interface InvoiceUploadResponse {
  message: string;
  jobId: string;
}

export interface InvoiceStatusResponse {
  status: InvoiceStatus;
  error?: string;
}

export interface InvoicePdfUrlResponse {
  url: string;
}
