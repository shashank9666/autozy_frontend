'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { servicesApi, dashboardApi } from '@/lib/api';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import ExportButton from '@/components/ExportButton';
import { exportAllPages } from '@/lib/export';

export default function DailyServicesPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: opsData, isLoading: opsLoading } = useQuery({
    queryKey: ['operations-dashboard'],
    queryFn: () => dashboardApi.getOperations(),
  });

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['service-records', selectedDate],
    queryFn: () => servicesApi.getRecords({ date: selectedDate, page: 1, limit: 100 }),
  });

  const stats = opsData?.data?.data || opsData?.data || {};
  const records = recordsData?.data?.data?.items || recordsData?.data?.data || recordsData?.data?.items || [];
  const recordsList = Array.isArray(records) ? records : [];

  const isLoading = opsLoading || recordsLoading;

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'info' | 'danger' | 'warning'> = {
      CLEANED: 'success', CNA: 'info', MISSED: 'danger', PENDING: 'warning',
    };
    return <Badge variant={map[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Daily Services</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time cleaning operations monitoring</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            onClick={async () => {
              try {
                await exportAllPages(
                  (p, l) => servicesApi.getRecords({ date: selectedDate, page: p, limit: l }),
                  [
                    { key: 'vehicle.vehicle_number', header: 'Vehicle', transform: (v, r) => v || r.vehicle_id?.slice(0, 8) || '-' },
                    { key: 'detailer.name', header: 'Detailer' },
                    { key: 'status', header: 'Status' },
                    { key: 'completed_at', header: 'Completed At', transform: (v) => v ? new Date(v).toLocaleTimeString('en-IN') : '-' },
                    { key: 'notes', header: 'Notes' },
                  ],
                  `services-${selectedDate}`,
                );
              } catch (e: any) { alert(e.message); }
            }}
            disabled={isLoading || recordsList.length === 0}
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total" value={stats.total || 0} color="yellow" />
        <StatCard title="Cleaned" value={stats.cleaned || 0} color="green" subtitle={`${stats.slaCompliance || 0}% SLA`} />
        <StatCard title="CNA" value={stats.cna || 0} color="blue" subtitle={`${stats.cnaPercent || 0}%`} />
        <StatCard title="Missed" value={stats.missed || 0} color="red" subtitle={`${stats.missedPercent || 0}%`} />
        <StatCard title="Pending" value={stats.pending || 0} color="yellow" />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-autozy-charcoal">Service Records - {selectedDate}</h3>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : recordsList.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No service records for this date</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Detailer</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Completed At</th>
                  <th className="px-4 py-3 text-left">Photos</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recordsList.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {rec.vehicle?.vehicle_number || rec.vehicle_id?.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">{rec.detailer?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{statusBadge(rec.status)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {rec.completed_at ? new Date(rec.completed_at).toLocaleTimeString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {rec.photos?.length || 0} photos
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                      {rec.notes || '-'}
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
