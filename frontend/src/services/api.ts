import { api } from './axios';
import type {
  Invoice,
  InvoiceFilters,
  InvoiceUploadResponse,
  InvoiceStatusResponse,
  InvoicePdfUrlResponse
} from '../types/invoice';
import type {
  EnergyData,
  FinancialData,
  DashboardResponse
} from '../types/dashboard';

interface PaginatedResponse<T> {
  invoices: T[];
  total: number;
}

export const invoiceService = {
  getInvoices: async (filters?: InvoiceFilters & { page?: number; limit?: number }) => {
    const params: Record<string, string | number> = {};

    if (filters?.clientNumber) {
      params.clientNumber = filters.clientNumber;
    }

    if (filters?.startDate) {
      params.startDate = filters.startDate.toISOString();
    }

    if (filters?.endDate) {
      params.endDate = filters.endDate.toISOString();
    }

    if (filters?.month) {
      params.month = filters.month.toISOString();
    }

    if (filters?.page) {
      params.page = filters.page;
    }

    if (filters?.limit) {
      params.limit = filters.limit;
    }

    const { data } = await api.get<PaginatedResponse<Invoice>>('/invoices', { params });
    return data;
  },

  uploadInvoice: async (file: File): Promise<InvoiceUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<InvoiceUploadResponse>('/invoices/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getInvoiceStatus: async (invoiceId: string): Promise<InvoiceStatusResponse> => {
    const { data } = await api.get<InvoiceStatusResponse>(`/invoices/${invoiceId}/status`);
    return data;
  },

  getInvoicePdfUrl: async (invoiceId: string, expiresIn?: number): Promise<InvoicePdfUrlResponse> => {
    const params = expiresIn ? { expiresIn } : undefined;
    const { data } = await api.get<InvoicePdfUrlResponse>(`/invoices/${invoiceId}/pdf-url`, { params });
    return data;
  },

  reprocessInvoice: async (invoiceId: string): Promise<InvoiceUploadResponse> => {
    const { data } = await api.post<InvoiceUploadResponse>(`/invoices/${invoiceId}/reprocess`);
    return data;
  },
};

export const dashboardService = {
  getDashboardData: async (filters?: {
    clientNumber?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<DashboardResponse> => {
    const params: Record<string, string> = {};

    if (filters?.clientNumber) {
      params.clientNumber = filters.clientNumber;
    }

    if (filters?.startDate) {
      params.startDate = filters.startDate.toISOString();
    }

    if (filters?.endDate) {
      params.endDate = filters.endDate.toISOString();
    }

    const { data } = await api.get<DashboardResponse>('/dashboard', { params });
    return data;
  },
};

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return data;
  },

  register: async (email: string, password: string, name: string) => {
    const { data } = await api.post('/auth/register', { email, password, name });
    return data;
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('Refresh token não encontrado');
    }
    const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken });
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
