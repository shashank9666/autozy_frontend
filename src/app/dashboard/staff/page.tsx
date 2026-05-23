'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApi, areasApi, rolesApi } from '@/lib/api';
import { useState } from 'react';
import Badge from '@/components/Badge';
import ExportButton from '@/components/ExportButton';
import { exportAllPages } from '@/lib/export';

const STANDARD_ROLES = ['DETAILER', 'INSPECTOR', 'SUPERVISOR', 'SPECIALIST', 'CITY_MANAGER', 'ADMIN', 'ACCOUNTANT'];

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [page, setPage] = useState(1);

  // Forms states
  const [createForm, setCreateForm] = useState({
    phone: '',
    name: '',
    email: '',
    roleOption: 'DETAILER', // Holds either standard role or dynamic role id
    cityId: '',
    areaId: '',
  });

  const [editForm, setEditForm] = useState({
    id: '',
    phone: '',
    name: '',
    email: '',
    roleOption: '',
    cityId: '',
    areaId: '',
    isActive: true,
  });

  // Query cities & areas
  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: () => areasApi.getCities(),
  });
  const cities = citiesData?.data?.data || [];

  const { data: createAreasData } = useQuery({
    queryKey: ['areas', createForm.cityId],
    queryFn: () => areasApi.getAreas({ cityId: createForm.cityId }),
    enabled: !!createForm.cityId,
  });
  const createAreas = createAreasData?.data?.data || [];

  const { data: editAreasData } = useQuery({
    queryKey: ['areas', editForm.cityId],
    queryFn: () => areasApi.getAreas({ cityId: editForm.cityId }),
    enabled: !!editForm.cityId,
  });
  const editAreas = editAreasData?.data?.data || [];

  // Query dynamic roles
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
  });
  const dynamicRoles = rolesData?.data?.data || [];

  // Combine standard and dynamic roles for dropdowns
  const availableRolesList = [
    ...STANDARD_ROLES.map((r) => ({ id: r, name: r.replace('_', ' '), isDynamic: false })),
    ...dynamicRoles.map((dr: any) => ({ id: dr.id, name: dr.name, isDynamic: true })),
  ];

  // Main staff listing query
  const { data, isLoading } = useQuery({
    queryKey: ['staff', roleFilter, page],
    queryFn: () => staffApi.getAll({ role: roleFilter || undefined, page, limit: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => staffApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setShowCreate(false);
      setCreateForm({ phone: '', name: '', email: '', roleOption: 'DETAILER', cityId: '', areaId: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) => staffApi.update(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setEditingStaff(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const staffList = data?.data?.data?.items || data?.data?.data || data?.data?.items || [];
  const allStaff = Array.isArray(staffList) ? staffList : [];
  const meta = data?.data?.meta || data?.data?.data?.meta || {};

  const handleEditClick = (staff: any) => {
    setEditingStaff(staff);
    // Find role option
    const roleOpt = staff.dynamic_role?.id || staff.role || '';
    setEditForm({
      id: staff.id,
      name: staff.name || '',
      phone: staff.phone || '',
      email: staff.email || '',
      roleOption: roleOpt,
      cityId: staff.city_id || '',
      areaId: staff.area_id || '',
      isActive: staff.is_active !== false,
    });
  };

  const handleSaveEdit = () => {
    const selectedRole = availableRolesList.find((r) => r.id === editForm.roleOption);
    const payload: any = {
      name: editForm.name,
      phone: editForm.phone,
      email: editForm.email,
      isActive: editForm.isActive,
    };

    if (selectedRole?.isDynamic) {
      payload.role = 'SPECIALIST'; // default standard role fallback
      payload.dynamicRoleId = selectedRole.id;
    } else {
      payload.role = selectedRole?.id;
      payload.dynamicRoleId = null;
    }

    payload.cityId = editForm.cityId || null;
    payload.areaId = editForm.areaId || null;

    updateMutation.mutate({ id: editForm.id, data: payload });
  };

  const handleOnboardSubmit = () => {
    const selectedRole = availableRolesList.find((r) => r.id === createForm.roleOption);
    const payload: any = {
      name: createForm.name,
      phone: createForm.phone,
    };

    if (createForm.email) payload.email = createForm.email;

    if (selectedRole?.isDynamic) {
      payload.role = 'SPECIALIST';
      payload.dynamicRoleId = selectedRole.id;
    } else {
      payload.role = selectedRole?.id;
      payload.dynamicRoleId = null;
    }

    if (createForm.cityId) payload.cityId = createForm.cityId;
    if (createForm.areaId) payload.areaId = createForm.areaId;

    createMutation.mutate(payload);
  };

  const roleBadge = (staff: any) => {
    const roleName = staff.dynamic_role?.name || staff.role || 'DETAILER';
    const map: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
      ADMIN: 'danger',
      CITY_MANAGER: 'info',
      SUPERVISOR: 'warning',
      DETAILER: 'success',
      INSPECTOR: 'default',
      SPECIALIST: 'info',
      ACCOUNTANT: 'success',
    };
    const variant = map[staff.role] || 'default';
    return <Badge variant={variant}>{roleName.replace('_', ' ')}</Badge>;
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
                    { key: 'role', header: 'Role', transform: (_, r) => r.dynamic_role?.name || r.role },
                    { key: 'city.name', header: 'City' },
                    { key: 'area.name', header: 'Area' },
                    { key: 'is_active', header: 'Status', transform: (v) => (v ? 'Active' : 'Inactive') },
                    { key: 'created_at', header: 'Joined', transform: (v) => (v ? new Date(v).toLocaleDateString('en-IN') : '-') },
                  ],
                  'staff'
                );
              } catch (e: any) {
                alert(e.message);
              }
            }}
            disabled={isLoading || allStaff.length === 0}
          />
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-semibold text-sm hover:bg-yellow-400 hover:shadow-md active:scale-95 transition-all duration-200"
          >
            {showCreate ? 'Cancel' : '+ Onboard Staff'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => {
            setRoleFilter('');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            !roleFilter
              ? 'bg-autozy-yellow text-autozy-dark shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Roles
        </button>
        {STANDARD_ROLES.map((r) => (
          <button
            key={r}
            onClick={() => {
              setRoleFilter(r);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              roleFilter === r
                ? 'bg-autozy-yellow text-autozy-dark shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {r.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Onboard Drawer Section */}
      {showCreate && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 transition-all duration-300 animate-slide-up">
          <h3 className="font-bold text-lg text-autozy-charcoal mb-4">Onboard New Staff</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Full Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Full Name"
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow text-autozy-charcoal bg-gray-50/50 hover:bg-gray-50 transition-all"
              />
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mobile Number</label>
              <input
                type="text"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="Mobile (10 digits)"
                maxLength={10}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow text-autozy-charcoal bg-gray-50/50 hover:bg-gray-50 transition-all"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email Address</label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="Email (optional)"
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow text-autozy-charcoal bg-gray-50/50 hover:bg-gray-50 transition-all"
              />
            </div>

            {/* Role dropdown containing BOTH Standard and Custom/Dynamic Roles */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Role</label>
              <select
                value={createForm.roleOption}
                onChange={(e) => setCreateForm({ ...createForm, roleOption: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow text-autozy-charcoal cursor-pointer font-medium hover:border-gray-300"
              >
                {availableRolesList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.isDynamic ? '(Custom)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">City</label>
              <select
                value={createForm.cityId}
                onChange={(e) => setCreateForm({ ...createForm, cityId: e.target.value, areaId: '' })}
                className="px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow text-autozy-charcoal cursor-pointer font-medium hover:border-gray-300"
              >
                <option value="">Select City (optional)</option>
                {cities.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Area Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Area</label>
              <select
                value={createForm.areaId}
                onChange={(e) => setCreateForm({ ...createForm, areaId: e.target.value })}
                disabled={!createForm.cityId}
                className="px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow text-autozy-charcoal disabled:opacity-50 cursor-pointer font-medium hover:border-gray-300"
              >
                <option value="">Select Area (optional)</option>
                {createAreas.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="flex gap-3 mt-5 justify-end">
            <button
              onClick={handleOnboardSubmit}
              disabled={!createForm.name || !createForm.phone || createForm.phone.length !== 10 || createMutation.isPending}
              className="px-6 py-2.5 bg-autozy-yellow text-autozy-dark rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-yellow-400 transition-all shadow-sm active:scale-95"
            >
              {createMutation.isPending ? 'Creating...' : 'Onboard Staff'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
          {createMutation.isError && (
            <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-xs font-semibold">
              {(createMutation.error as any)?.response?.data?.message || 'Failed to onboard staff'}
            </div>
          )}
        </div>
      )}

      {/* Main Staff Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
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
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold">Name</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Phone</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Email</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Role</th>
                  <th className="px-5 py-3.5 text-left font-semibold">City</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Area</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Joined</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allStaff.map((s: any) => (
                  <tr key={s.id} className="table-row-hover hover:bg-gray-50/80 transition-all duration-150">
                    <td className="px-5 py-3.5 font-medium text-autozy-charcoal">{s.name}</td>
                    <td className="px-5 py-3.5 text-gray-600">{s.phone}</td>
                    <td className="px-5 py-3.5 text-gray-500">{s.email || '-'}</td>
                    <td className="px-5 py-3.5">{roleBadge(s)}</td>
                    <td className="px-5 py-3.5 text-gray-500">{s.city?.name || '-'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{s.area?.name || '-'}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={s.is_active ? 'success' : 'danger'}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold flex items-center justify-end gap-3.5 mt-0.5">
                      <button
                        onClick={() => handleEditClick(s)}
                        className="text-autozy-yellow hover:text-yellow-600 font-semibold text-xs underline active-press"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to permanently delete staff member "${s.name}"?`)) {
                            deleteMutation.mutate(s.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-red-500 hover:text-red-700 font-semibold text-xs underline active-press disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">
              Page {page} of {meta.totalPages} ({meta.total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-xl disabled:opacity-40 hover:bg-gray-50 font-semibold transition-all active-press"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.totalPages}
                className="px-4 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-xl disabled:opacity-40 hover:bg-gray-50 font-semibold transition-all active-press"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Elegant Edit Staff Side Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-pop overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-autozy-charcoal">Edit Staff Member</h3>
                <p className="text-xs text-gray-500 mt-1">Modify info, roles, scope and dynamic status</p>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 outline-none"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mobile Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 outline-none"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 outline-none"
                />
              </div>

              {/* Role Option */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Role</label>
                <select
                  value={editForm.roleOption}
                  onChange={(e) => setEditForm({ ...editForm, roleOption: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white text-sm focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 outline-none"
                >
                  {availableRolesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.isDynamic ? '(Custom)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">City</label>
                <select
                  value={editForm.cityId}
                  onChange={(e) => setEditForm({ ...editForm, cityId: e.target.value, areaId: '' })}
                  className="w-full px-3 py-2 border rounded-xl bg-white text-sm focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 outline-none"
                >
                  <option value="">Select City (optional)</option>
                  {cities.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Area</label>
                <select
                  value={editForm.areaId}
                  onChange={(e) => setEditForm({ ...editForm, areaId: e.target.value })}
                  disabled={!editForm.cityId}
                  className="w-full px-3 py-2 border rounded-xl bg-white text-sm focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 disabled:opacity-50 outline-none"
                >
                  <option value="">Select Area (optional)</option>
                  {editAreas.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status toggler */}
              <label className="flex items-center gap-3 p-2.5 border rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-autozy-yellow rounded focus:ring-autozy-yellow"
                />
                <span className="text-sm font-semibold text-gray-700">Account Active & Enabled</span>
              </label>

            </div>
            <div className="px-6 py-4 bg-surface-muted border-t border-surface-border flex justify-end gap-3">
              <button
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editForm.name || !editForm.phone || updateMutation.isPending}
                className="px-5 py-2 bg-autozy-yellow text-autozy-dark rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-yellow-400 transition-all duration-200 active:scale-95"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
