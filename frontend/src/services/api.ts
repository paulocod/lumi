import { api } from './axios';
import type { Invoice, InvoiceFilters } from '../types/invoice';
import type { EnergyDataDto, FinancialDataDto, DashboardSummaryDto } from '../types/dashboard';

interface PaginatedResponse<T> {
  invoices: T[];
  total: number;
}

export const invoiceService = {
  getInvoices: async (filters?: InvoiceFilters & { page?: number; limit?: number }) => {
    // Converter as datas para o formato ISO
    const params: Record<string, string | number> = {};

    if (filters?.clientNumber) {
      params.clientNumber = filters.clientNumber;
    }

    if (filters?.startDate) {
      const startDate = new Date(filters.startDate);
      params.startDate = startDate.toISOString();
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      params.endDate = endDate.toISOString();
    }

    if (filters?.page) {
      params.page = filters.page;
    }

    if (filters?.limit) {
      params.limit = filters.limit;
    }

    console.log('[API] Buscando faturas com filtros:', params);
    try {
      const { data } = await api.get<PaginatedResponse<Invoice>>('/invoices', { params });
      console.log('[API] Faturas recebidas:', data);
      return data;
    } catch (error) {
      console.error('[API] Erro ao buscar faturas:', error);
      throw error;
    }
  },

  uploadInvoice: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<Invoice>('/invoices/upload/buffer', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  retryInvoice: async (invoiceId: string) => {
    const { data } = await api.post<Invoice>(`/invoices/${invoiceId}/retry`);
    return data;
  },
};

export const dashboardService = {
  getEnergyData: async () => {
    const { data } = await api.get<EnergyDataDto[]>('/dashboard/energy');
    return data;
  },

  getFinancialData: async () => {
    const { data } = await api.get<FinancialDataDto[]>('/dashboard/financial');
    return data;
  },

  getSummary: async () => {
    const { data } = await api.get<DashboardSummaryDto>('/dashboard/summary');
    return data;
  },
};

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
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
};
