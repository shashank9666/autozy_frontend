'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/lib/api';
import { useState } from 'react';
import Badge from '@/components/Badge';
import ExportButton from '@/components/ExportButton';
import { exportAllPages } from '@/lib/export';

const statusOptions = ['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'];

export default function TicketsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', statusFilter, page],
    queryFn: () => ticketsApi.getAll({
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      page,
      limit: 20,
    }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ticketsApi.resolve(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => ticketsApi.reject(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  });

  const tickets = data?.data?.data?.items || data?.data?.data || data?.data?.items || [];
  const ticketList = Array.isArray(tickets) ? tickets : [];
  const meta = data?.data?.meta || data?.data?.data?.meta || {};

  const statusBadge = (status: string) => {
    const map: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
      OPEN: 'info', IN_REVIEW: 'warning', RESOLVED: 'success', REJECTED: 'danger',
    };
    return <Badge variant={map[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Customer complaints & service disputes</p>
        </div>
        <ExportButton
          onClick={async () => {
            try {
              await exportAllPages(
                (p, l) => ticketsApi.getAll({
                  status: statusFilter !== 'ALL' ? statusFilter : undefined,
                  page: p, limit: l,
                }),
                [
                  { key: 'type', header: 'Type' },
                  { key: 'user.name', header: 'Customer', transform: (v, r) => v || r.user?.phone || '-' },
                  { key: 'vehicle.vehicle_number', header: 'Vehicle' },
                  { key: 'service_date', header: 'Service Date' },
                  { key: 'status', header: 'Status' },
                ],
                'tickets',
              );
            } catch (e: any) { alert(e.message); }
          }}
          disabled={isLoading || ticketList.length === 0}
        />
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
        ) : ticketList.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No tickets found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Service Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Auto-Valid</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ticketList.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-xs">
                      <Badge variant="default">{t.type}</Badge>
                    </td>
                    <td className="px-4 py-3">{t.user?.name || t.user?.phone || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{t.vehicle?.vehicle_number || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{t.service_date}</td>
                    <td className="px-4 py-3">{statusBadge(t.status)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.auto_validated ? 'success' : 'default'}>
                        {t.auto_validated ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {(t.status === 'OPEN' || t.status === 'IN_REVIEW') ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => resolveMutation.mutate({
                              id: t.id,
                              data: { resolutionType: 'SERVICE_EXTENSION', extensionDays: 1 },
                            })}
                            className="text-green-600 text-xs font-medium hover:underline"
                          >
                            Extend +1
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Reject ticket?`)) {
                                rejectMutation.mutate({ id: t.id, notes: 'Rejected by admin' });
                              }
                            }}
                            className="text-red-600 text-xs font-medium hover:underline"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
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
