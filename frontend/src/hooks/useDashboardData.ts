import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/api";
import type { DashboardResponse } from "../types/dashboard";
import { useAuth } from "./useAuthHook";
import { format } from "date-fns";
import { AxiosError } from "axios";

interface DashboardFilters {
  startDate?: Date;
  endDate?: Date;
  clientNumber?: string;
}

export function useDashboardData(filters?: DashboardFilters) {
  const { isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery<DashboardResponse>({
    queryKey: ["dashboard", filters],
    queryFn: async () => {
      try {
        if (
          filters?.startDate &&
          filters?.endDate &&
          filters.startDate > filters.endDate
        ) {
          throw new Error("Data inicial não pode ser maior que a data final");
        }

        const formattedFilters = {
          ...filters,
          startDate: filters?.startDate
            ? format(filters.startDate, "yyyy-MM-dd")
            : undefined,
          endDate: filters?.endDate
            ? format(filters.endDate, "yyyy-MM-dd")
            : undefined,
        };

        if (filters?.clientNumber) {
          const allData = await dashboardService.getDashboardData(
            formattedFilters
          );

          const filteredData = {
            ...allData,
            energyData: allData.energyData.filter(
              (item) => item.clientNumber === filters.clientNumber
            ),
            financialData: allData.financialData.filter(
              (item) => item.clientNumber === filters.clientNumber
            ),
          };

          return filteredData;
        }

        const data = await dashboardService.getDashboardData(formattedFilters);
        return data;
      } catch (error) {
        console.error("[useDashboardData] Erro ao buscar dados:", error);

        if (error instanceof AxiosError) {
          if (error.response?.status === 500) {
            console.error(
              "[useDashboardData] Erro 500 do servidor:",
              error.response.data
            );
            throw new Error(
              "Erro interno do servidor. Por favor, tente novamente mais tarde."
            );
          } else if (error.response?.status === 400) {
            console.error(
              "[useDashboardData] Erro 400 - Parâmetros inválidos:",
              error.response.data
            );
            throw new Error(
              "Parâmetros inválidos. Verifique os filtros aplicados."
            );
          } else if (error.response?.status === 401) {
            console.error("[useDashboardData] Erro 401 - Não autorizado");
            throw new Error(
              "Sessão expirada. Por favor, faça login novamente."
            );
          }
        }

        throw new Error(
          "Erro ao carregar dados do dashboard. Por favor, tente novamente."
        );
      }
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  const hasValidData =
    !isLoading &&
    data &&
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
