import { memo } from "react";
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
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { EnergyChartData, FinancialChartData } from "../types/dashboard";

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
  const chartData: ChartData<"line"> = {
    labels: data.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });
    }),
    datasets: lines.map((line) => ({
      label: line.name,
      data: data.map((item) => Number(item[line.key])),
      borderColor: line.color,
      backgroundColor: line.color,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: line.color,
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
    })),
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2,
    animation: {
      duration: 1000,
      easing: "easeInOutQuart",
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            size: 12,
            weight: "bold",
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: "bold",
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#1f2937",
        bodyColor: "#1f2937",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${value.toLocaleString("pt-BR")}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 11,
          },
          padding: 10,
        },
        title: {
          display: true,
          text: yAxisLabel,
          font: {
            size: 12,
            weight: "bold",
          },
          padding: {
            top: 0,
            bottom: 10,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          padding: 10,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-lumi-gray-100 p-6">
      <div className="h-[400px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
});
