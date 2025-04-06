import { ReactNode, memo } from 'react';

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
            <p className="mt-1 text-sm text-lumi-gray-500">
              {trend.isPositive ? '+' : '-'}{trend.value}% {trend.label}
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 text-sm text-lumi-gray-500">{description}</p>
    </div>
  );
});
