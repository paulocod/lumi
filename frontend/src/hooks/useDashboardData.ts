import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/api';
import type { DashboardResponse } from '../types/dashboard';
import { useAuth } from './useAuth';

interface DashboardFilters {
  startDate?: Date;
  endDate?: Date;
  clientNumber?: string;
}

export function useDashboardData(filters?: DashboardFilters) {
  const { isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery<DashboardResponse>({
    queryKey: ['dashboard', filters],
    queryFn: async () => {
      console.log('[useDashboardData] Buscando dados com filtros:', filters);
      try {
        // Se tiver clientNumber, busca todos os dados e filtra no frontend
        if (filters?.clientNumber) {
          const allData = await dashboardService.getDashboardData({
            startDate: filters.startDate,
            endDate: filters.endDate,
          });

          // Filtra os dados pelo número do cliente
          const filteredData = {
            ...allData,
            energyData: allData.energyData.filter(item => 
              item.clientNumber === filters.clientNumber
            ),
            financialData: allData.financialData.filter(item => 
              item.clientNumber === filters.clientNumber
            ),
          };
          
          console.log('[useDashboardData] Dados filtrados no frontend:', filteredData);
          return filteredData;
        }
        
        // Caso contrário, busca os dados filtrados do backend
        const data = await dashboardService.getDashboardData(filters);
        console.log('[useDashboardData] Dados recebidos do backend:', data);
        return data;
      } catch (error) {
        console.error('[useDashboardData] Erro ao buscar dados:', error);
        throw error;
      }
    },
    enabled: isAuthenticated,
    retry: 2,
  });

  const hasValidData = !isLoading && data &&
    Array.isArray(data.energyData) && 
    Array.isArray(data.financialData) &&
    data.energyData.length > 0 &&
    data.financialData.length > 0;

  return {
    data,
    isLoading,
    error,
    hasValidData,
  };
} 