import { memo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { EnergyChartData, FinancialChartData } from '../types/dashboard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartLine {
  key: string;
  name: string;
  color: string;
}

interface DashboardChartProps {
  title: string;
  data: EnergyChartData[] | FinancialChartData[];
  lines: ChartLine[];
  yAxisLabel: string;
}

export const DashboardChart = memo(function DashboardChart({
  title,
  data,
  lines,
  yAxisLabel,
}: DashboardChartProps) {
  const chartData: ChartData<'line'> = {
    labels: data.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric',
      });
    }),
    datasets: lines.map((line) => ({
      label: line.name,
      data: data.map((item) => Number(item[line.key])),
      borderColor: line.color,
      backgroundColor: line.color,
      tension: 0.4,
    })),
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value.toLocaleString('pt-BR')}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: yAxisLabel,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-lumi-gray-100 p-6">
      <div className="h-[300px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
});
