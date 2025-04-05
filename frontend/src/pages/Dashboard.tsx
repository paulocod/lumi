import { useQuery } from '@tanstack/react-query';
import { Zap, Sun, DollarSign, TrendingUp } from 'lucide-react';
import { DashboardCard } from '../components/DashboardCard';
import { DashboardChart } from '../components/DashboardChart';
import { dashboardService } from '../services/api';

export function Dashboard() {
  const { data: energyData, isLoading: isLoadingEnergy } = useQuery({
    queryKey: ['energy-data'],
    queryFn: dashboardService.getEnergyData,
  });

  const { data: financialData, isLoading: isLoadingFinancial } = useQuery({
    queryKey: ['financial-data'],
    queryFn: dashboardService.getFinancialData,
  });

  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardService.getSummary,
  });

  const isLoading = isLoadingEnergy || isLoadingFinancial || isLoadingSummary;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        ))}
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
