'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi, plansApi } from '@/lib/api';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import ExportButton from '@/components/ExportButton';
import { exportAllPages } from '@/lib/export';

const statusOptions = ['ALL', 'ACTIVE', 'PAUSED', 'PENDING_INSPECTION', 'EXPIRED', 'CANCELLED'];

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'subs' | 'models'>('subs');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Models/Plans management states
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    washesPerMonth: 26,
    waterWash: 0,
    internal: 0,
  });

  // Main subscriptions list query
  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', statusFilter, page],
    queryFn: () =>
      subscriptionsApi.getAll({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        limit: 20,
      }),
  });

  // Base subscription plans query
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getAll(),
  });

  const subs = data?.data?.data?.items || data?.data?.data || data?.data?.items || [];
  const subsList = Array.isArray(subs) ? subs : [];
  const meta = data?.data?.meta || data?.data?.data?.meta || {};
  const planList = plansData?.data?.data || plansData?.data || [];
  const allPlans = Array.isArray(planList) ? planList : [];

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

  // Plans/Models mutations
  const createPlanMutation = useMutation({
    mutationFn: (data: any) => plansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setShowPlanForm(false);
      resetPlanForm();
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) => plansApi.update(payload.id, payload.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setEditingPlan(null);
      resetPlanForm();
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => plansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete plan. It might be used by active pricing matrices.');
    },
  });

  const resetPlanForm = () => {
    setPlanForm({
      name: '',
      description: '',
      washesPerMonth: 26,
      waterWash: 0,
      internal: 0,
    });
  };

  const handleEditPlanClick = (plan: any) => {
    setEditingPlan(plan);
    const features = plan.features || {};
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      washesPerMonth: features.washes_per_month ?? 26,
      waterWash: features.water_wash ?? 0,
      internal: features.internal ?? 0,
    });
    setShowPlanForm(true);
  };

  const handleSavePlan = () => {
    const payload = {
      name: planForm.name,
      description: planForm.description,
      features: {
        washes_per_month: Number(planForm.washesPerMonth),
        water_wash: Number(planForm.waterWash),
        internal: Number(planForm.internal),
      },
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data: payload });
    } else {
      createPlanMutation.mutate(payload);
    }
  };

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
      {/* Title */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Subscriptions Matrix</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer subscriptions & lifecycle models</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'subs' && (
            <ExportButton
              onClick={async () => {
                try {
                  await exportAllPages(
                    (p, l) =>
                      subscriptionsApi.getAll({
                        status: statusFilter !== 'ALL' ? statusFilter : undefined,
                        page: p,
                        limit: l,
                      }),
                    [
                      { key: 'user.name', header: 'Customer' },
                      {
                        key: 'vehicle.registration_number',
                        header: 'Vehicle',
                        transform: (v, r) => v || r.vehicle?.vehicle_number || '-',
                      },
                      { key: 'plan_pricing.plan.name', header: 'Plan' },
                      { key: 'status', header: 'Status' },
                      { key: 'start_date', header: 'Start Date' },
                      { key: 'end_date', header: 'End Date' },
                    ],
                    'subscriptions'
                  );
                } catch (e: any) {
                  alert(e.message);
                }
              }}
              disabled={isLoading || subsList.length === 0}
            />
          )}
          {activeTab === 'models' && (
            <button
              onClick={() => {
                setEditingPlan(null);
                resetPlanForm();
                setShowPlanForm(!showPlanForm);
              }}
              className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-semibold text-sm hover:bg-yellow-400 shadow-sm transition-all duration-200 active:scale-95"
            >
              {showPlanForm ? 'Close Form' : '+ Create Plan Model'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-gray-100 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('subs')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'subs' ? 'text-autozy-yellow' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Active Subscriptions
          {activeTab === 'subs' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-autozy-yellow" />}
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'models' ? 'text-autozy-yellow' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Subscription Models (CRUD)
          {activeTab === 'models' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-autozy-yellow" />}
        </button>
      </div>

      {activeTab === 'subs' ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Active" value={counts.active} color="green" />
            <StatCard title="Pending Inspection" value={counts.pendingInspection} color="yellow" />
            <StatCard title="Paused" value={counts.paused} color="blue" />
            <StatCard title="Cancelled" value={counts.cancelled} color="red" />
          </div>

          {/* Subscriptions Listing Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b flex flex-wrap gap-2 bg-gray-50/50">
              {statusOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    statusFilter === s
                      ? 'bg-autozy-yellow text-autozy-dark shadow-sm'
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
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-5 py-3.5 text-left font-semibold">ID</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Customer</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Vehicle</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Plan</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Start Date</th>
                      <th className="px-5 py-3.5 text-left font-semibold">End Date</th>
                      <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subsList.map((sub: any) => (
                      <tr key={sub.id} className="table-row-hover hover:bg-gray-50/80 transition-all duration-150">
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{sub.id?.slice(0, 8)}...</td>
                        <td className="px-5 py-3.5 font-medium text-autozy-charcoal">
                          {sub.user?.name || sub.user?.phone || 'N/A'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{sub.vehicle?.vehicle_number || '-'}</td>
                        <td className="px-5 py-3.5 text-gray-500">{sub.plan?.name || '-'}</td>
                        <td className="px-5 py-3.5">{statusBadge(sub.status)}</td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {sub.start_date ? new Date(sub.start_date).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {sub.end_date ? new Date(sub.end_date).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold">
                          <div className="flex gap-2.5 justify-end mt-0.5">
                            {sub.status === 'ACTIVE' && (
                              <button
                                onClick={() => {
                                  if (confirm(`Pause subscription ${sub.id?.slice(0, 8)}?`)) {
                                    pauseMutation.mutate(sub.id);
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline active-press"
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
                                className="text-red-600 hover:text-red-800 text-xs font-semibold underline active-press"
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
              <div className="p-4 border-t flex items-center justify-between bg-gray-50/50">
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
        </>
      ) : (
        /* Plan Models Management Tab (CRUD) */
        <div className="space-y-6 animate-slide-up">
          {showPlanForm && (
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm animate-slide-up">
              <h3 className="font-bold text-lg text-autozy-charcoal mb-4">
                {editingPlan ? 'Edit Subscription Model' : 'Create Subscription Model'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Plan Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Plan Name</label>
                  <input
                    type="text"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="e.g. REGULAR_CLEANING"
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow text-autozy-charcoal bg-gray-50/50 hover:bg-gray-50 transition-all"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Description</label>
                  <input
                    type="text"
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    placeholder="Short description of base features"
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow text-autozy-charcoal bg-gray-50/50 hover:bg-gray-50 transition-all"
                  />
                </div>

                {/* Washes Per Month */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Washes per Month</label>
                  <input
                    type="number"
                    value={planForm.washesPerMonth}
                    onChange={(e) => setPlanForm({ ...planForm, washesPerMonth: Number(e.target.value) })}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow text-autozy-charcoal bg-gray-50/50 hover:bg-gray-50 transition-all"
                  />
                </div>

                {/* Water Washes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Water Washes</label>
                  <input
                    type="number"
                    value={planForm.waterWash}
                    onChange={(e) => setPlanForm({ ...planForm, waterWash: Number(e.target.value) })}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow text-autozy-charcoal bg-gray-50/50 hover:bg-gray-50 transition-all"
                  />
                </div>

                {/* Internal deep cleanings */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Internal deep cleanings</label>
                  <input
                    type="number"
                    value={planForm.internal}
                    onChange={(e) => setPlanForm({ ...planForm, internal: Number(e.target.value) })}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow text-autozy-charcoal bg-gray-50/50 hover:bg-gray-50 transition-all"
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-3 justify-end">
                <button
                  onClick={handleSavePlan}
                  disabled={!planForm.name || createPlanMutation.isPending || updatePlanMutation.isPending}
                  className="px-6 py-2.5 bg-autozy-yellow text-autozy-dark rounded-xl font-semibold text-sm hover:bg-yellow-400 transition-all shadow-sm active:scale-95"
                >
                  {createPlanMutation.isPending || updatePlanMutation.isPending ? 'Saving...' : 'Save Plan Model'}
                </button>
                <button
                  onClick={() => {
                    setShowPlanForm(false);
                    setEditingPlan(null);
                    resetPlanForm();
                  }}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Listing Existing Plan Models */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plansLoading ? (
              <div className="text-gray-500 col-span-full">Loading models...</div>
            ) : allPlans.length === 0 ? (
              <div className="text-gray-500 col-span-full">No subscription models defined yet.</div>
            ) : (
              allPlans.map((plan: any) => {
                const features = plan.features || {};
                return (
                  <div
                    key={plan.id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 hover:border-autozy-yellow/30 p-5 flex flex-col justify-between transition-all duration-300 transform hover:translate-y-[-2px]"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-base text-autozy-charcoal tracking-wide uppercase">
                          {plan.name}
                        </span>
                        <Badge variant={plan.is_active !== false ? 'success' : 'danger'}>
                          {plan.is_active !== false ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mb-4 h-10 overflow-hidden line-clamp-2">
                        {plan.description || 'No description provided.'}
                      </p>

                      {/* Features Badges */}
                      <div className="space-y-2.5 border-t border-gray-50 pt-3">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-400 uppercase tracking-wider">Regular Washes</span>
                          <span className="text-autozy-charcoal">{features.washes_per_month ?? 0} washes</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-400 uppercase tracking-wider">Water Washes</span>
                          <span className="text-autozy-charcoal">{features.water_wash ?? 0} washes</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-400 uppercase tracking-wider">Internal Deep Cleans</span>
                          <span className="text-autozy-charcoal">{features.internal ?? 0} services</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-50 mt-5 pt-3.5 flex items-center justify-between">
                      <button
                        onClick={() => handleEditPlanClick(plan)}
                        className="text-autozy-yellow hover:text-yellow-600 font-bold text-xs underline active-press"
                      >
                        Edit Model
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to permanently delete the plan model "${plan.name}"? This will delete all referenced rules.`
                            )
                          ) {
                            deletePlanMutation.mutate(plan.id);
                          }
                        }}
                        disabled={deletePlanMutation.isPending}
                        className="text-red-500 hover:text-red-700 font-bold text-xs underline active-press disabled:opacity-40"
                      >
                        Delete Model
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
