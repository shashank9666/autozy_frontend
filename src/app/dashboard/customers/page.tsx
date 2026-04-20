'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import ExportButton from '@/components/ExportButton';
import { exportAllPages } from '@/lib/export';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => usersApi.getAll({ search: search || undefined, page, limit: 20 }),
  });

  const customers = data?.data?.data?.items || data?.data?.data || data?.data?.items || [];
  const customerList = Array.isArray(customers) ? customers : [];
  const meta = data?.data?.meta || data?.data?.data?.meta || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer accounts</p>
        </div>
        <ExportButton
          onClick={async () => {
            try {
              await exportAllPages(
                (p, l) => usersApi.getAll({ search: search || undefined, page: p, limit: l }),
                [
                  { key: 'name', header: 'Name' },
                  { key: 'phone', header: 'Phone' },
                  { key: 'email', header: 'Email' },
                  { key: 'vehicles', header: 'Vehicles', transform: (v, r) => String(r.vehicleCount || r.vehicles?.length || 0) },
                  { key: 'activeSubscriptions', header: 'Active Subs', transform: (v) => String(v || 0) },
                  { key: 'created_at', header: 'Joined', transform: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '-' },
                ],
                'customers',
              );
            } catch (e: any) { alert(e.message); }
          }}
          disabled={isLoading || customerList.length === 0}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full md:w-80 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow/50"
          />
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : customerList.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            {search ? 'No customers match your search' : 'No customers found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Vehicles</th>
                  <th className="px-4 py-3 text-left">Active Subs</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customerList.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{user.name || 'N/A'}</td>
                    <td className="px-4 py-3">{user.phone}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {user.vehicleCount || user.vehicles?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs">
                        {user.activeSubscriptions || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : '-'}
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
