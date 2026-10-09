import { ReactNode } from 'react';
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  colorClass?: string;
}

export function StatCard({ label, value, icon, trend, colorClass = 'bg-primary-50 text-primary-600' }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      {icon && (
        <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', colorClass)}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className={clsx('text-xs mt-0.5', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
