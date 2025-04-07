import { ReactNode, memo } from "react";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  description: string;
  formatValue: (value: number) => string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
    noData?: boolean;
  };
}

export const DashboardCard = memo(function DashboardCard({
  title,
  value,
  icon,
  description,
  formatValue,
  trend,
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-lumi-gray-100 p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 bg-lumi-green-50 rounded-lg flex items-center justify-center text-lumi-green-600">
            {icon}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-sm font-medium text-lumi-gray-500">{title}</h3>
          <p className="mt-1 text-2xl font-semibold text-lumi-gray-900">
            {formatValue(value)}
          </p>
          {trend && (
            <div className="mt-1 flex items-center text-sm">
              {trend.noData ? (
                <>
                  <Info className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-gray-600">
                    Dados insuficientes para comparação
                  </span>
                </>
              ) : (
                <>
                  {trend.value > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : trend.value < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-500 mr-1" />
                  )}
                  <span
                    className={
                      trend.value > 0
                        ? "text-green-600"
                        : trend.value < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }
                  >
                    {trend.value > 0 ? "+" : ""}
                    {trend.value}% em relação ao mês anterior
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm text-lumi-gray-500">{description}</p>
    </div>
  );
});
