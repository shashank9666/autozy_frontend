'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi, rolesApi } from '@/lib/api';

const AVAILABLE_PERMISSIONS = [
  { id: 'manage_staff', label: 'Manage Staff (Workforce)' },
  { id: 'manage_customers', label: 'Manage Customers' },
  { id: 'manage_subscriptions', label: 'Manage Subscriptions' },
  { id: 'manage_pricing', label: 'Manage Pricing Matrix' },
  { id: 'view_financials', label: 'View Financials (General)' },
  { id: 'view_payments', label: 'View Payments' },
  { id: 'manage_expenses', label: 'Manage Expenses' },
  { id: 'send_broadcasts', label: 'Send Broadcasts & Notifications' },
  { id: 'manage_inspections', label: 'Manage Inspections' },
  { id: 'manage_services', label: 'Manage Daily Services' },
  { id: 'manage_tickets', label: 'Manage Support Tickets' },
  { id: 'manage_addons', label: 'Manage Add-ons & Equipment' },
  { id: 'view_reports', label: 'View Analytics & Reports' },
  { id: 'manage_config', label: 'Manage System Config' },
  { id: 'manage_roles', label: 'Manage Roles & Permissions' },
];

const COLOR_MAP: Record<string, { bg: string; text: string; badge: string }> = {
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700'   },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700'  },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700'},
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700'},
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-700',   badge: 'bg-teal-100 text-teal-700'   },
  gray:   { bg: 'bg-gray-50',   text: 'text-gray-700',   badge: 'bg-gray-100 text-gray-700'   },
};

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as string[] });

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['roles-summary'],
    queryFn: () => staffApi.getRolesSummary(),
  });

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, payload: any }) => rolesApi.update(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setForm({ name: '', description: '', permissions: [] });
  };

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setForm({ name: role.name, description: role.description || '', permissions: role.permissions || [] });
    setShowModal(true);
  };

  const togglePermission = (permId: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  const summary = summaryData?.data?.data || [];
  const dynamicRoles = rolesData?.data?.data || [];
  
  const countMap = Object.fromEntries(summary.map((s: any) => [s.role, s.count]));
  const totalStaff = summary.reduce((sum: number, s: any) => sum + s.count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">Staff roles, access levels and team composition</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-medium text-sm hover:bg-yellow-400 transition-colors"
        >
          + Create Role
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Active Staff</p>
          <p className="text-3xl font-bold text-autozy-charcoal mt-1">
            {summaryLoading ? '—' : totalStaff}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Roles Defined</p>
          <p className="text-3xl font-bold text-autozy-charcoal mt-1">{dynamicRoles.length || 6}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Admins</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">
            {summaryLoading ? '—' : countMap['ADMIN'] || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Field Staff</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {summaryLoading ? '—' : (countMap['DETAILER'] || 0) + (countMap['SPECIALIST'] || 0) + (countMap['INSPECTOR'] || 0)}
          </p>
        </div>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {rolesLoading ? (
          <div className="text-gray-500 col-span-full">Loading dynamic roles...</div>
        ) : dynamicRoles.length === 0 ? (
          <div className="text-gray-500 col-span-full">No dynamic roles defined yet. Create one to get started!</div>
        ) : (
          dynamicRoles.map((r: any) => {
            const c = COLOR_MAP.gray;
            // Staff table groups by 'dynamic_role_id' for custom roles
            const count = summaryLoading ? null : (countMap[r.id] ?? countMap[r.name] ?? 0);
            return (
              <div key={r.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className={`${c.bg} px-5 py-4 flex items-center justify-between`}>
                  <div>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${c.text}`}>{r.name}</span>
                    <p className="text-xs text-gray-500 mt-0.5">Dynamic Role</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${c.text}`}>
                      {count === null ? '—' : count}
                    </span>
                    <p className="text-xs text-gray-500">active</p>
                  </div>
                </div>

                <div className="px-5 py-4 flex-1">
                  <p className="text-sm text-gray-600 mb-3">{r.description || 'No description provided.'}</p>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {r.permissions?.length > 0 ? r.permissions.map((perm: string) => {
                        const label = AVAILABLE_PERMISSIONS.find(p => p.id === perm)?.label || perm;
                        return (
                          <span key={perm} className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.badge}`}>
                            {label}
                          </span>
                        );
                      }) : (
                        <span className="text-xs text-gray-400 italic">None</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t bg-gray-50 flex items-center justify-between">
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(r)} className="text-xs font-semibold text-autozy-yellow hover:text-yellow-600">Edit</button>
                  </div>
                  <button onClick={() => deleteMutation.mutate(r.id)} className="text-xs font-semibold text-red-500 hover:text-red-700">
                    {deleteMutation.isPending ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Role Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-pop overflow-hidden animate-slide-up max-h-[90vh]">
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-autozy-charcoal">{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Role Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Lead Inspector"
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-autozy-yellow focus:ring-1 focus:ring-autozy-yellow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short description of this role"
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-autozy-yellow focus:ring-1 focus:ring-autozy-yellow"
                  />
                </div>
                
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-3">Permissions</label>
                  <div className="space-y-2">
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <label key={perm.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="w-4 h-4 text-autozy-yellow rounded focus:ring-autozy-yellow"
                        />
                        <span className="text-sm font-medium text-gray-700">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-muted border-t border-surface-border flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
              <button
                onClick={() => {
                  if (editingRole) {
                    updateMutation.mutate({ id: editingRole.id, payload: form });
                  } else {
                    createMutation.mutate(form);
                  }
                }}
                disabled={!form.name || createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-medium text-sm disabled:opacity-50"
              >
                {editingRole ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
