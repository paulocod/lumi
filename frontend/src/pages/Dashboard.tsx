import { useQuery } from '@tanstack/react-query';
import { Zap, Sun, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { DashboardCard } from '../components/DashboardCard';
import { DashboardChart } from '../components/DashboardChart';
import { dashboardService } from '../services/api';
import type {
  EnergyDataDto,
  FinancialDataDto,
  DashboardSummaryDto,
  EnergyChartData,
  FinancialChartData,
  SummaryData,
} from '../types/dashboard';
import { useAuth } from '../hooks/useAuth';

export function Dashboard() {
  const { isAuthenticated } = useAuth();

  console.log('[Dashboard] Estado de autenticação:', isAuthenticated);

  const { data: energyData, isLoading: isLoadingEnergy, error: energyError } = useQuery<EnergyDataDto[], Error, EnergyChartData[]>({
    queryKey: ['energy-data'],
    queryFn: async () => {
      console.log('[Dashboard] Buscando dados de energia...');
      const data = await dashboardService.getEnergyData();
      console.log('[Dashboard] Dados de energia recebidos:', data);
      return data;
    },
    retry: 2,
    select: (data) => data?.map((item) => ({
      date: item.month,
      consumption: item.electricityConsumption,
      compensated: item.compensatedEnergy,
    })) || [],
    enabled: isAuthenticated,
  });

  const { data: financialData, isLoading: isLoadingFinancial, error: financialError } = useQuery<FinancialDataDto[], Error, FinancialChartData[]>({
    queryKey: ['financial-data'],
    queryFn: async () => {
      console.log('[Dashboard] Buscando dados financeiros...');
      const data = await dashboardService.getFinancialData();
      console.log('[Dashboard] Dados financeiros recebidos:', data);
      return data;
    },
    retry: 2,
    select: (data) => data?.map((item) => ({
      date: item.month,
      totalWithoutGD: item.totalWithoutGD,
      gdSavings: item.gdSavings,
    })) || [],
    enabled: isAuthenticated,
  });

  const { data: summary, isLoading: isLoadingSummary, error: summaryError } = useQuery<DashboardSummaryDto, Error, SummaryData>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      console.log('[Dashboard] Buscando resumo...');
      const data = await dashboardService.getSummary();
      console.log('[Dashboard] Resumo recebido:', data);
      return data;
    },
    retry: 2,
    select: (data) => ({
      totalConsumption: data?.totalElectricityConsumption || 0,
      totalCompensated: data?.totalCompensatedEnergy || 0,
      totalValueWithoutGD: data?.totalWithoutGD || 0,
      totalGdSavings: data?.totalGDSavings || 0,
      savingsPercentage: data?.savingsPercentage || 0,
    }),
    enabled: isAuthenticated,
  });

  const isLoading = isLoadingEnergy || isLoadingFinancial || isLoadingSummary;
  const hasError = energyError || financialError || summaryError;

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 rounded-xl p-6 flex items-start">
        <AlertCircle className="h-6 w-6 text-yellow-600 mt-0.5" />
        <div className="ml-4">
          <h3 className="text-lg font-medium text-yellow-800">
            Autenticação necessária
          </h3>
          <p className="mt-2 text-sm text-yellow-700">
            Você precisa estar autenticado para visualizar o dashboard. Por favor, faça login.
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
            <div key={i} className="bg-white rounded-xl shadow-sm border border-lumi-gray-100 p-6">
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
            <div key={i} className="bg-white rounded-xl shadow-sm border border-lumi-gray-100 p-6">
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

  if (hasError) {
    console.error('[Dashboard] Erros:', {
      energy: energyError,
      financial: financialError,
      summary: summaryError,
    });
    return (
      <div className="bg-red-50 rounded-xl p-6 flex items-start">
        <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
        <div className="ml-4">
          <h3 className="text-lg font-medium text-red-800">
            Erro ao carregar dados do dashboard
          </h3>
          <p className="mt-2 text-sm text-red-700">
            Ocorreu um erro ao carregar os dados. Por favor, tente novamente mais tarde ou entre em contato com o suporte.
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

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Consumo Total"
          value={`${summary?.totalConsumption.toLocaleString('pt-BR')} kWh`}
          icon={<Zap className="h-6 w-6" />}
          description="Energia consumida no período"
          trend={summary?.savingsPercentage ? {
            value: summary.savingsPercentage,
            isPositive: true,
          } : undefined}
        />
        <DashboardCard
          title="Energia Compensada"
          value={`${summary?.totalCompensated.toLocaleString('pt-BR')} kWh`}
          icon={<Sun className="h-6 w-6" />}
          description="Energia compensada por GD"
        />
        <DashboardCard
          title="Valor sem GD"
          value={`R$ ${summary?.totalValueWithoutGD.toLocaleString('pt-BR')}`}
          icon={<DollarSign className="h-6 w-6" />}
          description="Valor total sem desconto GD"
        />
        <DashboardCard
          title="Economia GD"
          value={`R$ ${summary?.totalGdSavings.toLocaleString('pt-BR')}`}
          icon={<TrendingUp className="h-6 w-6" />}
          description="Economia com geração distribuída"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChart
          title="Consumo vs Compensação de Energia"
          data={energyData || []}
          lines={[
            {
              key: 'consumption',
              name: 'Consumo (kWh)',
              color: '#0284c7',
            },
            {
              key: 'compensated',
              name: 'Compensado (kWh)',
              color: '#059669',
            },
          ]}
          yAxisLabel="kWh"
        />
        <DashboardChart
          title="Valor vs Economia"
          data={financialData || []}
          lines={[
            {
              key: 'totalWithoutGD',
              name: 'Valor sem GD (R$)',
              color: '#dc2626',
            },
            {
              key: 'gdSavings',
              name: 'Economia GD (R$)',
              color: '#059669',
            },
          ]}
          yAxisLabel="R$"
        />
      </div>
    </div>
  );
}
