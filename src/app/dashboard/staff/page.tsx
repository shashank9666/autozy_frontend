'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi, areasApi } from '@/lib/api';
import { useState } from 'react';
import Badge from '@/components/Badge';
import ExportButton from '@/components/ExportButton';
import { exportAllPages } from '@/lib/export';

const ROLES = ['DETAILER', 'INSPECTOR', 'SUPERVISOR', 'SPECIALIST', 'CITY_MANAGER', 'ADMIN'];

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ phone: '', name: '', email: '', role: 'DETAILER', cityId: '', areaId: '' });

  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: () => areasApi.getCities(),
  });
  const cities = citiesData?.data?.data || [];

  const { data, isLoading } = useQuery({
    queryKey: ['staff', roleFilter, page],
    queryFn: () => staffApi.getAll({ role: roleFilter || undefined, page, limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => staffApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setShowCreate(false);
      setForm({ phone: '', name: '', email: '', role: 'DETAILER', cityId: '', areaId: '' });
    },
  });

  const staffList = data?.data?.data?.items || data?.data?.data || data?.data?.items || [];
  const allStaff = Array.isArray(staffList) ? staffList : [];
  const meta = data?.data?.meta || data?.data?.data?.meta || {};

  const roleBadge = (role: string) => {
    const map: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
      ADMIN: 'danger', CITY_MANAGER: 'info', SUPERVISOR: 'warning', DETAILER: 'success', INSPECTOR: 'default', SPECIALIST: 'info',
    };
    return <Badge variant={map[role] || 'default'}>{role.replace('_', ' ')}</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Workforce Management</h1>
          <p className="text-sm text-gray-500 mt-1">Onboard and manage staff members</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            onClick={async () => {
              try {
                await exportAllPages(
                  (p, l) => staffApi.getAll({ role: roleFilter || undefined, page: p, limit: l }),
                  [
                    { key: 'name', header: 'Name' },
                    { key: 'phone', header: 'Phone' },
                    { key: 'email', header: 'Email' },
                    { key: 'role', header: 'Role' },
                    { key: 'city.name', header: 'City' },
                    { key: 'is_active', header: 'Status', transform: (v) => v ? 'Active' : 'Inactive' },
                    { key: 'created_at', header: 'Joined', transform: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '-' },
                  ],
                  'staff',
                );
              } catch (e: any) { alert(e.message); }
            }}
            disabled={isLoading || allStaff.length === 0}
          />
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-medium text-sm hover:bg-yellow-400 transition-colors"
          >
            {showCreate ? 'Cancel' : '+ Onboard Staff'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setRoleFilter(''); setPage(1); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!roleFilter ? 'bg-autozy-yellow text-autozy-dark' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          All
        </button>
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => { setRoleFilter(r); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${roleFilter === r ? 'bg-autozy-yellow text-autozy-dark' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {r.replace('_', ' ')}
          </button>
        ))}
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold mb-4">Onboard New Staff</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" className="px-4 py-2 border rounded-lg text-sm" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Mobile (10 digits)" className="px-4 py-2 border rounded-lg text-sm" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (optional)" className="px-4 py-2 border rounded-lg text-sm" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="px-4 py-2 border rounded-lg text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
            <select value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} className="px-4 py-2 border rounded-lg text-sm">
              <option value="">Select City (optional)</option>
              {(Array.isArray(cities) ? cities : []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                const payload: any = { name: form.name, phone: form.phone, role: form.role };
                if (form.email) payload.email = form.email;
                if (form.cityId) payload.cityId = form.cityId;
                if (form.areaId) payload.areaId = form.areaId;
                createMutation.mutate(payload);
              }}
              disabled={!form.name || !form.phone || form.phone.length !== 10 || createMutation.isPending}
              className="px-6 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-medium text-sm disabled:opacity-40"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
            {createMutation.isError && (
              <span className="text-red-500 text-xs self-center">{(createMutation.error as any)?.response?.data?.errors?.join(', ') || 'Failed'}</span>
            )}
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : allStaff.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No staff found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">City</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allStaff.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3">{s.phone}</td>
                    <td className="px-4 py-3 text-gray-500">{s.email || '-'}</td>
                    <td className="px-4 py-3">{roleBadge(s.role)}</td>
                    <td className="px-4 py-3 text-gray-500">{s.city?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.is_active ? 'success' : 'danger'}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : '-'}
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
