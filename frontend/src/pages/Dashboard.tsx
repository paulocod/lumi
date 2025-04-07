import { Zap, Sun, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { DashboardChart } from "../components/DashboardChart";
import { useDashboardData } from "../hooks/useDashboardData";
import type { EnergyChartData, FinancialChartData } from "../types/dashboard";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { startOfMonth, endOfMonth } from "date-fns";
import { useState } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { FilterFormData } from "../schemas/filterSchema";

export function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<FilterFormData>({});

  const {
    data: dashboardData,
    isLoading,
    error,
    hasValidData,
  } = useDashboardData({
    startDate: filters.startDate
      ? startOfMonth(new Date(filters.startDate))
      : undefined,
    endDate: filters.endDate
      ? endOfMonth(new Date(filters.endDate))
      : undefined,
    clientNumber: filters.clientNumber,
  });

  const sortedEnergyData =
    hasValidData && dashboardData
      ? [...dashboardData.energyData].sort(
          (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
        )
      : [];

  const sortedFinancialData =
    hasValidData && dashboardData
      ? [...dashboardData.financialData].sort(
          (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
        )
      : [];

  const energyData: EnergyChartData[] =
    hasValidData && dashboardData
      ? sortedEnergyData.map((item) => ({
          date:
            typeof item.month === "string"
              ? item.month
              : new Date(item.month).toISOString(),
          consumption: item.electricityConsumption,
          compensated: item.compensatedEnergy,
        }))
      : [];

  const financialData: FinancialChartData[] =
    hasValidData && dashboardData
      ? sortedFinancialData.map((item) => ({
          date:
            typeof item.month === "string"
              ? item.month
              : new Date(item.month).toISOString(),
          totalWithoutGD: item.totalWithoutGD,
          gdSavings: item.gdSavings,
        }))
      : [];

  const totalConsumption =
    hasValidData && dashboardData
      ? dashboardData.energyData.reduce(
          (acc, curr) => acc + curr.electricityConsumption,
          0
        )
      : 0;

  const totalCompensated =
    hasValidData && dashboardData
      ? dashboardData.energyData.reduce(
          (acc, curr) => acc + curr.compensatedEnergy,
          0
        )
      : 0;

  const totalValueWithoutGD =
    hasValidData && dashboardData
      ? dashboardData.financialData.reduce(
          (acc, curr) => acc + curr.totalWithoutGD,
          0
        )
      : 0;

  const totalGdSavings =
    hasValidData && dashboardData
      ? dashboardData.financialData.reduce(
          (acc, curr) => acc + curr.gdSavings,
          0
        )
      : 0;

  const calculateMonthOverMonthChange = (
    currentValue: number,
    previousValue: number
  ) => {
    if (previousValue === 0) return 0;

    const change = ((currentValue - previousValue) / previousValue) * 100;
    return Number(change.toFixed(1));
  };

  const hasEnoughData =
    sortedEnergyData.length >= 2 && sortedFinancialData.length >= 2;

  const consumptionChange = hasEnoughData
    ? calculateMonthOverMonthChange(
        sortedEnergyData[sortedEnergyData.length - 1].electricityConsumption,
        sortedEnergyData[sortedEnergyData.length - 2].electricityConsumption
      )
    : 0;

  const compensatedChange = hasEnoughData
    ? calculateMonthOverMonthChange(
        sortedEnergyData[sortedEnergyData.length - 1].compensatedEnergy,
        sortedEnergyData[sortedEnergyData.length - 2].compensatedEnergy
      )
    : 0;

  const valueWithoutGDChange = hasEnoughData
    ? calculateMonthOverMonthChange(
        sortedFinancialData[sortedFinancialData.length - 1].totalWithoutGD,
        sortedFinancialData[sortedFinancialData.length - 2].totalWithoutGD
      )
    : 0;

  const gdSavingsChange = hasEnoughData
    ? calculateMonthOverMonthChange(
        sortedFinancialData[sortedFinancialData.length - 1].gdSavings,
        sortedFinancialData[sortedFinancialData.length - 2].gdSavings
      )
    : 0;

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 rounded-xl p-6 flex items-start">
        <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
        <div className="ml-4">
          <h3 className="text-lg font-medium text-yellow-800">
            Autenticação necessária
          </h3>
          <p className="mt-2 text-sm text-yellow-700">
            Você precisa estar autenticado para visualizar o dashboard. Por
            favor, faça login.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-lumi-gray-100 p-6"
            >
              <div className="animate-pulse flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 bg-lumi-gray-200 rounded-lg"></div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-lumi-gray-200 rounded w-1/2"></div>
                  <div className="mt-3 h-6 bg-lumi-gray-200 rounded w-3/4"></div>
                  <div className="mt-2 h-4 bg-lumi-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-lumi-gray-100 p-6"
            >
              <div className="animate-pulse">
                <div className="h-6 bg-lumi-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-[300px] bg-lumi-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error("[Dashboard] Erro ao carregar dados:", error);
    return (
      <div className="bg-red-50 rounded-xl p-6 flex items-start">
        <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
        <div className="ml-4">
          <h3 className="text-lg font-medium text-red-800">
            Erro ao carregar dados do dashboard
          </h3>
          <p className="mt-2 text-sm text-red-700">
            Ocorreu um erro ao carregar os dados. Por favor, tente novamente
            mais tarde ou entre em contato com o suporte.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!hasValidData) {
    return (
      <div className="bg-yellow-50 rounded-xl p-6 flex items-start">
        <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
        <div className="ml-4">
          <h3 className="text-lg font-medium text-yellow-800">
            Sem dados disponíveis
          </h3>
          <p className="mt-2 text-sm text-yellow-700">
            Não há dados disponíveis para exibir no dashboard. Por favor, tente
            novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <DateRangeFilter
        onFilterChange={setFilters}
        initialValues={filters}
        immediateFilter={true}
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Consumo Total"
          value={totalConsumption}
          icon={<Zap className="h-6 w-6" />}
          description="Energia consumida no período"
          formatValue={(value) => `${value.toLocaleString("pt-BR")} kWh`}
          trend={{
            value: consumptionChange,
            isPositive: consumptionChange >= 0,
            label: "em relação ao mês anterior",
            noData: !hasEnoughData,
          }}
        />
        <DashboardCard
          title="Energia Compensada"
          value={totalCompensated}
          icon={<Sun className="h-6 w-6" />}
          description="Energia compensada por GD"
          formatValue={(value) => `${value.toLocaleString("pt-BR")} kWh`}
          trend={{
            value: compensatedChange,
            isPositive: compensatedChange >= 0,
            label: "em relação ao mês anterior",
            noData: !hasEnoughData,
          }}
        />
        <DashboardCard
          title="Valor sem GD"
          value={totalValueWithoutGD}
          icon={<DollarSign className="h-6 w-6" />}
          description="Valor total sem desconto GD"
          formatValue={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
          trend={{
            value: valueWithoutGDChange,
            isPositive: valueWithoutGDChange >= 0,
            label: "em relação ao mês anterior",
            noData: !hasEnoughData,
          }}
        />
        <DashboardCard
          title="Economia GD"
          value={totalGdSavings}
          icon={<TrendingUp className="h-6 w-6" />}
          description="Economia com geração distribuída"
          formatValue={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
          trend={{
            value: gdSavingsChange,
            isPositive: gdSavingsChange >= 0,
            label: "em relação ao mês anterior",
            noData: !hasEnoughData,
          }}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChart
          title="Consumo vs Compensação de Energia"
          data={energyData}
          lines={[
            {
              key: "consumption",
              name: "Consumo (kWh)",
              color: "#0284c7",
            },
            {
              key: "compensated",
              name: "Compensado (kWh)",
              color: "#059669",
            },
          ]}
          yAxisLabel="kWh"
        />
        <DashboardChart
          title="Valor vs Economia"
          data={financialData}
          lines={[
            {
              key: "totalWithoutGD",
              name: "Valor sem GD (R$)",
              color: "#dc2626",
            },
            {
              key: "gdSavings",
              name: "Economia GD (R$)",
              color: "#059669",
            },
          ]}
          yAxisLabel="R$"
        />
      </div>
    </div>
  );
}
