'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inspectionsApi, staffApi, vehiclesApi } from '@/lib/api';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import ExportButton from '@/components/ExportButton';
import { exportAllPages } from '@/lib/export';
import Modal from '@/components/Modal';
import FormInput from '@/components/FormInput';
import { useAuthStore } from '@/lib/store';

const statusOptions = ['ALL', 'PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];

export default function InspectionsPage() {
  const queryClient = useQueryClient();
  const staff = useAuthStore((s) => s.staff);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    subscription_id: '',
    vehicle_id: '',
    inspector_id: '',
    status: 'PENDING',
    scheduled_at: '',
    parking_available: false,
    pillar_number: '',
    keys_provided: false,
    security_permission: false,
    internal_cleaning_required: false,
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['inspections', statusFilter],
    queryFn: () => inspectionsApi.getAll({ status: statusFilter !== 'ALL' ? statusFilter : undefined, page: 1, limit: 50 }),
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff', 'INSPECTOR'],
    queryFn: () => staffApi.getAll({ role: 'INSPECTOR', limit: 100 }),
    enabled: showModal,
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getAll(),
    enabled: showModal,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => inspectionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => inspectionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      setShowModal(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setForm({
      subscription_id: '',
      vehicle_id: '',
      inspector_id: '',
      status: 'PENDING',
      scheduled_at: '',
      parking_available: false,
      pillar_number: '',
      keys_provided: false,
      security_permission: false,
      internal_cleaning_required: false,
      notes: '',
    });
    setEditingId(null);
  };

  const handleEdit = (insp: any) => {
    setEditingId(insp.id);
    setForm({
      subscription_id: insp.subscription_id || '',
      vehicle_id: insp.vehicle_id || '',
      inspector_id: insp.inspector_id || '',
      status: insp.status || 'PENDING',
      scheduled_at: insp.scheduled_at ? new Date(insp.scheduled_at).toISOString().slice(0, 16) : '',
      parking_available: insp.parking_available || false,
      pillar_number: insp.pillar_number || '',
      keys_provided: insp.keys_provided || false,
      security_permission: insp.security_permission || false,
      internal_cleaning_required: insp.internal_cleaning_required || false,
      notes: insp.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const getArray = (res: any) => {
    const d = res?.data;
    if (!d) return [];
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.data?.items)) return d.data.items;
    if (Array.isArray(d.items)) return d.items;
    return [];
  };

  const allInspections = getArray(data);
  const inspectors = getArray(staffData);
  const vehicles = getArray(vehiclesData);
  const vehicleOptions = (() => {
    const list = [...vehicles];
    if (form.vehicle_id && !list.some((v: any) => v.id === form.vehicle_id)) {
      list.unshift({ id: form.vehicle_id, vehicle_number: 'Previous vehicle', brand: '', model: '', user: { name: '' } });
    }
    return list;
  })();

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

  const role = staff?.role?.toUpperCase();
  const canManage = role === 'ADMIN' || role === 'INSPECTOR' || role === 'CITY_MANAGER' || role === 'SUPERVISOR';

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Inspections</h1>
          <p className="text-sm text-gray-500 mt-1">Vehicle inspection queue & history</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-medium text-sm hover:bg-yellow-400 transition-colors"
            >
              + New Inspection
            </button>
          )}
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
                  <th className="px-4 py-3 text-left">Actions</th>
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
                    <td className="px-4 py-3">
                      {canManage && (
                        <button
                          onClick={() => handleEdit(insp)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Inspection' : 'New Inspection'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Core Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select
                  value={form.vehicle_id}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setForm({ ...form, vehicle_id: '', subscription_id: '' });
                    } else {
                      const v = vehicles.find((x: any) => x.id === e.target.value);
                      setForm({
                        ...form,
                        vehicle_id: e.target.value,
                        subscription_id: v?.active_subscription?.id || '',
                      });
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-autozy-yellow focus:border-transparent transition-all duration-200"
                >
                  <option value="">None</option>
                  {vehicleOptions.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_number} ({v.brand} {v.model}) - {v.user?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inspector</label>
                <select
                  value={form.inspector_id}
                  onChange={(e) => setForm({ ...form, inspector_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-autozy-yellow focus:border-transparent transition-all duration-200"
                >
                  <option value="">Unassigned</option>
                  {inspectors.map((i: any) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-autozy-yellow focus:border-transparent transition-all duration-200"
                  required
                >
                  {statusOptions.filter(o => o !== 'ALL').map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <FormInput
                label="Scheduled Date & Time"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                required
              />
            </div>

            {/* Right Column: Physical checks, location details & comments */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements & Flags</label>
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="parking_available"
                      checked={form.parking_available}
                      onChange={(e) => setForm({ ...form, parking_available: e.target.checked })}
                      className="rounded border-gray-300 text-autozy-yellow focus:ring-autozy-yellow"
                    />
                    <label htmlFor="parking_available" className="text-xs font-medium text-gray-700 cursor-pointer">Parking Available</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="keys_provided"
                      checked={form.keys_provided}
                      onChange={(e) => setForm({ ...form, keys_provided: e.target.checked })}
                      className="rounded border-gray-300 text-autozy-yellow focus:ring-autozy-yellow"
                    />
                    <label htmlFor="keys_provided" className="text-xs font-medium text-gray-700 cursor-pointer">Keys Provided</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="security_permission"
                      checked={form.security_permission}
                      onChange={(e) => setForm({ ...form, security_permission: e.target.checked })}
                      className="rounded border-gray-300 text-autozy-yellow focus:ring-autozy-yellow"
                    />
                    <label htmlFor="security_permission" className="text-xs font-medium text-gray-700 cursor-pointer">Security Permission</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="internal_cleaning_required"
                      checked={form.internal_cleaning_required}
                      onChange={(e) => setForm({ ...form, internal_cleaning_required: e.target.checked })}
                      className="rounded border-gray-300 text-autozy-yellow focus:ring-autozy-yellow"
                    />
                    <label htmlFor="internal_cleaning_required" className="text-xs font-medium text-gray-700 cursor-pointer">Internal Cleaning</label>
                  </div>
                </div>
              </div>

              <FormInput
                label="Pillar Number"
                type="text"
                value={form.pillar_number}
                onChange={(e) => setForm({ ...form, pillar_number: e.target.value })}
              />

              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Add inspection comments or notes..."
                  className="w-full flex-1 min-h-[90px] px-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-autozy-yellow focus:border-transparent transition-all duration-200 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg text-sm font-medium hover:bg-yellow-400 transition-colors disabled:opacity-40"
            >
              {editingId ? 'Update Inspection' : 'Create Inspection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
