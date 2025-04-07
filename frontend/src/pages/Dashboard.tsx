import { Zap, Sun, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { DashboardCard } from "../components/DashboardCard";
import { DashboardChart } from "../components/DashboardChart";
import { useDashboardData } from "../hooks/useDashboardData";
import type { EnergyChartData, FinancialChartData } from "../types/dashboard";
import { useAuth } from "../hooks/useAuthHook";

export function Dashboard() {
  const { isAuthenticated } = useAuth();

  const {
    data: dashboardData,
    isLoading,
    error,
    hasValidData,
  } = useDashboardData();

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
      <div className="flex items-center justify-center h-full">
        <p className="text-lumi-gray-500">Faça login para visualizar o dashboard</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lumi-gray-500">Carregando dados do dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lumi-gray-500">
            Erro ao carregar dados do dashboard. Por favor, tente novamente mais
            tarde.
          </p>
        </div>
      </div>
    );
  }

  if (!hasValidData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lumi-gray-500">
          Nenhum dado disponível para exibição no dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          description="Economia total com GD"
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
          title="Consumo de Energia"
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
          title="Dados Financeiros"
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
