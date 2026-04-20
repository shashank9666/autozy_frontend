import { clsx } from 'clsx';
import { type ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  color?: 'yellow' | 'green' | 'red' | 'blue' | 'purple' | 'gray';
  icon?: ReactNode;
}

const COLOR_MAP: Record<NonNullable<StatCardProps['color']>, { ring: string; text: string; bg: string }> = {
  yellow: { ring: 'ring-autozy-yellow/20', text: 'text-autozy-yellow-dark', bg: 'bg-autozy-yellow/10' },
  green:  { ring: 'ring-emerald-500/20',   text: 'text-emerald-600',         bg: 'bg-emerald-50' },
  red:    { ring: 'ring-red-500/20',       text: 'text-red-600',             bg: 'bg-red-50' },
  blue:   { ring: 'ring-blue-500/20',      text: 'text-blue-600',            bg: 'bg-blue-50' },
  purple: { ring: 'ring-purple-500/20',    text: 'text-purple-600',          bg: 'bg-purple-50' },
  gray:   { ring: 'ring-gray-300/30',      text: 'text-gray-700',            bg: 'bg-gray-100' },
};

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  color = 'yellow',
  icon,
}: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className="group relative bg-white rounded-2xl p-5 border border-surface-border shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* subtle corner accent */}
      <div className={clsx('absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-50 blur-2xl', c.bg)} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">{title}</p>
          <p className="text-3xl font-bold text-autozy-charcoal mt-2 tabular-nums leading-none">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1.5">{subtitle}</p>}
          {trend && (
            <div className={clsx(
              'inline-flex items-center gap-1 mt-2 px-1.5 py-0.5 rounded-md text-xs font-semibold',
              trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
            )}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={trend.positive ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
              </svg>
              {trend.positive ? '+' : ''}{trend.value}%
              <span className="text-gray-400 font-normal ml-0.5">vs prev</span>
            </div>
          )}
        </div>

        {icon && (
          <div className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center ring-1 flex-shrink-0',
            c.bg, c.ring, c.text,
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
