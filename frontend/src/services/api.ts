import axios from 'axios';
import type { Invoice, InvoiceFilters, DashboardData } from '../types/invoice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const invoiceService = {
  getInvoices: async (filters: InvoiceFilters) => {
    const { data } = await api.get<Invoice[]>('/invoices', { params: filters });
    return data;
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
};

export const dashboardService = {
  getEnergyData: async () => {
    const { data } = await api.get<DashboardData['energyConsumption']>('/dashboard/energy');
    return data;
  },

  getFinancialData: async () => {
    const { data } = await api.get<DashboardData['financialData']>('/dashboard/financial');
    return data;
  },

  getSummary: async () => {
    const { data } = await api.get<DashboardData['summary']>('/dashboard/summary');
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
    const { data } = await api.post('/auth/refresh');
    return data;
  },
};
