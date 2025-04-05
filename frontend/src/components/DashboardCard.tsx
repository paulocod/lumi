import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function DashboardCard({
  title,
  value,
  icon,
  description,
  trend,
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-lumi-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-lumi-green-50 text-lumi-green-600">
            {icon}
          </div>
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-lumi-gray-600">{title}</h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-lumi-gray-900">{value}</p>
            {trend && (
              <p
                className={`ml-2 text-sm font-medium ${
                  trend.isPositive ? 'text-lumi-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '+' : '-'}
                {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-lumi-gray-500">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
