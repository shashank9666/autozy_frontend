'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import Link from 'next/link';
import StatCard from '@/components/StatCard';
import { useAuthStore } from '@/lib/store';

const ICONS = {
  total: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
    </svg>
  ),
  cleaned: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  cna: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  missed: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  pending: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const QUICK_ACTIONS = [
  { href: '/dashboard/services',     label: 'Daily Services', desc: 'Monitor today',    color: 'bg-amber-100 text-amber-700',   icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href: '/dashboard/tickets',      label: 'Support',        desc: 'Open complaints',  color: 'bg-red-100 text-red-700',       icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  { href: '/dashboard/staff',        label: 'Workforce',      desc: 'Manage team',      color: 'bg-blue-100 text-blue-700',     icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { href: '/dashboard/subscriptions',label: 'Subscriptions',  desc: 'Active plans',     color: 'bg-purple-100 text-purple-700', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/dashboard/areas',        label: 'Areas',          desc: 'City capacity',    color: 'bg-emerald-100 text-emerald-700', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { href: '/dashboard/reports',      label: 'Reports',        desc: 'Analytics',        color: 'bg-indigo-100 text-indigo-700', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

export default function DashboardPage() {
  const staff = useAuthStore((s) => s.staff);
  const { data, isLoading } = useQuery({
    queryKey: ['operations-dashboard'],
    queryFn: () => dashboardApi.getOperations(),
  });

  const stats = data?.data?.data || data?.data || {};
  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = staff?.name?.split(' ')[0] || '';

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{greeting}, {firstName} 👋</p>
          <h1 className="text-2xl font-bold text-autozy-charcoal mt-1">Here's what's happening today</h1>
        </div>
        <div className="text-xs text-gray-500 bg-white border border-surface-border rounded-lg px-3 py-2 inline-flex items-center gap-2 self-start md:self-auto">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-surface-border">
              <div className="skeleton h-3 w-20 mb-3" />
              <div className="skeleton h-8 w-14" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Total Services" value={stats.total || 0} color="yellow" icon={ICONS.total} />
          <StatCard title="Cleaned" value={stats.cleaned || 0} color="green" subtitle={`${stats.slaCompliance || 0}% SLA`} icon={ICONS.cleaned} />
          <StatCard title="CNA" value={stats.cna || 0} color="blue" subtitle={`${stats.cnaPercent || 0}%`} icon={ICONS.cna} />
          <StatCard title="Missed" value={stats.missed || 0} color="red" subtitle={`${stats.missedPercent || 0}%`} icon={ICONS.missed} />
          <StatCard title="Pending" value={stats.pending || 0} color="gray" icon={ICONS.pending} />
        </div>
      )}

      {/* SLA + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SLA Gauge */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-surface-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-autozy-charcoal">SLA Compliance</h3>
            <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Today</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative w-44 h-44">
              <svg className="w-44 h-44 -rotate-90" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="slaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F5C518" />
                    <stop offset="100%" stopColor="#E0B316" />
                  </linearGradient>
                </defs>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#EEF0F4" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="url(#slaGrad)" strokeWidth="10"
                  strokeDasharray={`${(stats.slaCompliance || 0) * 3.267} 326.7`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-autozy-charcoal tabular-nums">{stats.slaCompliance || 0}%</span>
                <span className="text-2xs text-gray-500 uppercase tracking-wider mt-0.5">On time</span>
              </div>
            </div>

            <div className="w-full mt-5 grid grid-cols-2 gap-3">
              {[
                { label: 'Cleaned', value: stats.cleaned || 0, color: 'bg-emerald-500' },
                { label: 'CNA',     value: stats.cna || 0,     color: 'bg-blue-500' },
                { label: 'Missed',  value: stats.missed || 0,  color: 'bg-red-500' },
                { label: 'Pending', value: stats.pending || 0, color: 'bg-gray-300' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-3 py-2 bg-surface-muted rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${row.color} flex-shrink-0`} />
                    <span className="text-xs text-gray-600 truncate">{row.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-autozy-charcoal tabular-nums">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-surface-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-autozy-charcoal">Quick Actions</h3>
              <p className="text-xs text-gray-500 mt-0.5">Jump straight to what matters</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex items-start gap-3 p-3.5 rounded-xl border border-surface-border hover:border-autozy-yellow hover:bg-autozy-yellow/5 hover:shadow-soft transition-all"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-autozy-charcoal truncate">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{item.desc}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-autozy-yellow group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
