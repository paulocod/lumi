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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartDataset {
  date: string;
  [key: string]: string | number;
}

interface DashboardChartProps {
  title: string;
  data: ChartDataset[];
  lines: {
    key: string;
    name: string;
    color: string;
  }[];
  yAxisLabel?: string;
}

export function DashboardChart({
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
          display: !!yAxisLabel,
          text: yAxisLabel,
        },
      },
    },
  };

  return (
    <div className="card">
      <div className="h-[300px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
