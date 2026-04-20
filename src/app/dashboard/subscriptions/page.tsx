'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '@/lib/api';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import ExportButton from '@/components/ExportButton';
import { exportAllPages } from '@/lib/export';

const statusOptions = ['ALL', 'ACTIVE', 'PAUSED', 'PENDING_INSPECTION', 'EXPIRED', 'CANCELLED'];

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', statusFilter, page],
    queryFn: () =>
      subscriptionsApi.getAll({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        limit: 20,
      }),
  });

  const subs = data?.data?.data?.items || data?.data?.data || data?.data?.items || [];
  const subsList = Array.isArray(subs) ? subs : [];
  const meta = data?.data?.meta || data?.data?.data?.meta || {};

  const counts = {
    active: subsList.filter((s: any) => s.status === 'ACTIVE').length,
    paused: subsList.filter((s: any) => s.status === 'PAUSED').length,
    pendingInspection: subsList.filter((s: any) => s.status === 'PENDING_INSPECTION').length,
    cancelled: subsList.filter((s: any) => s.status === 'CANCELLED').length,
  };

  const pauseMutation = useMutation({
    mutationFn: (id: string) => subscriptionsApi.pause(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => subscriptionsApi.cancel(id, 'Cancelled by admin'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
      ACTIVE: 'success',
      PAUSED: 'info',
      PENDING_INSPECTION: 'warning',
      EXPIRED: 'default',
      CANCELLED: 'danger',
    };
    return <Badge variant={map[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Subscriptions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer subscriptions & lifecycle</p>
        </div>
        <ExportButton
          onClick={async () => {
            try {
              await exportAllPages(
                (p, l) => subscriptionsApi.getAll({
                  status: statusFilter !== 'ALL' ? statusFilter : undefined,
                  page: p, limit: l,
                }),
                [
                  { key: 'user.name', header: 'Customer' },
                  { key: 'vehicle.registration_number', header: 'Vehicle', transform: (v, r) => v || r.vehicle?.vehicle_number || '-' },
                  { key: 'plan_pricing.plan.name', header: 'Plan' },
                  { key: 'status', header: 'Status' },
                  { key: 'start_date', header: 'Start Date' },
                  { key: 'end_date', header: 'End Date' },
                ],
                'subscriptions',
              );
            } catch (e: any) { alert(e.message); }
          }}
          disabled={isLoading || subsList.length === 0}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active" value={counts.active} color="green" />
        <StatCard title="Pending Inspection" value={counts.pendingInspection} color="yellow" />
        <StatCard title="Paused" value={counts.paused} color="blue" />
        <StatCard title="Cancelled" value={counts.cancelled} color="red" />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex flex-wrap gap-2">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-autozy-yellow text-autozy-dark'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : subsList.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No subscriptions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Start Date</th>
                  <th className="px-4 py-3 text-left">End Date</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subsList.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{sub.id?.slice(0, 8)}...</td>
                    <td className="px-4 py-3 font-medium">{sub.user?.name || sub.user?.phone || 'N/A'}</td>
                    <td className="px-4 py-3">{sub.vehicle?.vehicle_number || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{sub.plan?.name || '-'}</td>
                    <td className="px-4 py-3">{statusBadge(sub.status)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {sub.start_date ? new Date(sub.start_date).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {sub.end_date ? new Date(sub.end_date).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {sub.status === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              if (confirm(`Pause subscription ${sub.id?.slice(0, 8)}?`)) {
                                pauseMutation.mutate(sub.id);
                              }
                            }}
                            className="text-blue-600 text-xs font-medium hover:underline"
                          >
                            Pause
                          </button>
                        )}
                        {['ACTIVE', 'PAUSED'].includes(sub.status) && (
                          <button
                            onClick={() => {
                              if (confirm(`Cancel subscription ${sub.id?.slice(0, 8)}? This cannot be undone.`)) {
                                cancelMutation.mutate(sub.id);
                              }
                            }}
                            className="text-red-600 text-xs font-medium hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {page} of {meta.totalPages} ({meta.total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
