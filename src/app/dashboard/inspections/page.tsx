'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inspectionsApi } from '@/lib/api';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import ExportButton from '@/components/ExportButton';
import { exportAllPages } from '@/lib/export';

const statusOptions = ['ALL', 'PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];

export default function InspectionsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['inspections', statusFilter],
    queryFn: () => inspectionsApi.getAll({ status: statusFilter !== 'ALL' ? statusFilter : undefined, page: 1, limit: 50 }),
  });

  const inspections = data?.data?.data?.items || data?.data?.data || data?.data?.items || [];
  const allInspections = Array.isArray(inspections) ? inspections : [];

  const counts = {
    pending: allInspections.filter((i: any) => i.status === 'PENDING').length,
    scheduled: allInspections.filter((i: any) => i.status === 'SCHEDULED').length,
    inProgress: allInspections.filter((i: any) => i.status === 'IN_PROGRESS').length,
    completed: allInspections.filter((i: any) => i.status === 'COMPLETED').length,
    failed: allInspections.filter((i: any) => i.status === 'FAILED').length,
  };

  const statusBadge = (status: string) => {
    const map: Record<string, 'warning' | 'info' | 'default' | 'success' | 'danger'> = {
      PENDING: 'warning', SCHEDULED: 'info', IN_PROGRESS: 'default', COMPLETED: 'success', FAILED: 'danger',
    };
    return <Badge variant={map[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Inspections</h1>
          <p className="text-sm text-gray-500 mt-1">Vehicle inspection queue & history</p>
        </div>
        <ExportButton
          onClick={async () => {
            try {
              await exportAllPages(
                (p, l) => inspectionsApi.getAll({
                  status: statusFilter !== 'ALL' ? statusFilter : undefined,
                  page: p, limit: l,
                }),
                [
                  { key: 'vehicle.vehicle_number', header: 'Vehicle', transform: (v, r) => v || r.vehicle_id?.slice(0, 8) || '-' },
                  { key: 'inspector.name', header: 'Inspector', transform: (v) => v || 'Unassigned' },
                  { key: 'status', header: 'Status' },
                  { key: 'scheduled_at', header: 'Scheduled', transform: (v) => v ? new Date(v).toLocaleString('en-IN') : '-' },
                  { key: 'completed_at', header: 'Completed', transform: (v) => v ? new Date(v).toLocaleString('en-IN') : '-' },
                ],
                'inspections',
              );
            } catch (e: any) { alert(e.message); }
          }}
          disabled={isLoading || allInspections.length === 0}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard title="Pending" value={counts.pending} color="yellow" />
        <StatCard title="Scheduled" value={counts.scheduled} color="blue" />
        <StatCard title="In Progress" value={counts.inProgress} color="yellow" />
        <StatCard title="Completed" value={counts.completed} color="green" />
        <StatCard title="Failed" value={counts.failed} color="red" />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex flex-wrap gap-2">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
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
        ) : allInspections.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No inspections found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Inspector</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Scheduled</th>
                  <th className="px-4 py-3 text-left">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allInspections.map((insp: any) => (
                  <tr key={insp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{insp.id?.slice(0, 8)}...</td>
                    <td className="px-4 py-3">
                      {insp.vehicle?.vehicle_number || insp.vehicle_id?.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">{insp.inspector?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3">{statusBadge(insp.status)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {insp.scheduled_at ? new Date(insp.scheduled_at).toLocaleString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {insp.completed_at ? new Date(insp.completed_at).toLocaleString('en-IN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
