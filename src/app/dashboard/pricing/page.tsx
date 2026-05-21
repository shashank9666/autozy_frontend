'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingApi, areasApi, plansApi } from '@/lib/api';
import Badge from '@/components/Badge';

const VEHICLE_SIZES = ['HATCHBACK', 'SEDAN', 'SUV', 'PREMIUM'];

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [selectedCity, setSelectedCity] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  
  // Pricing Edit Modal State
  const [editingPricing, setEditingPricing] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Plans Manager Modal State
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({ name: '', description: '' });

  const [form, setForm] = useState({
    planId: '',
    vehicleSize: 'SEDAN',
    priceMonthly: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
  });

  const { data: citiesData } = useQuery({
    queryKey: ['cities'],
    queryFn: () => areasApi.getCities(),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getAll(),
  });

  const { data: pricingData, isLoading } = useQuery({
    queryKey: ['pricing', selectedCity],
    queryFn: () => pricingApi.getMatrix(selectedCity),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => pricingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      setShowCreate(false);
      setForm({ planId: '', vehicleSize: 'SEDAN', priceMonthly: '', effectiveFrom: new Date().toISOString().split('T')[0] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => pricingApi.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      setEditingPricing(null);
      setEditForm({});
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: any) => plansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setEditingPlan(null);
      setPlanForm({ name: '', description: '' });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: (data: { id: string, name: string, description: string }) => plansApi.update(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setEditingPlan(null);
      setPlanForm({ name: '', description: '' });
    },
  });

  const handleEditPricing = (p: any) => {
    setEditingPricing(p);
    // Parse date safely
    let effectiveFromStr = '';
    if (p.effective_from) {
      try {
        const d = new Date(p.effective_from);
        if (!isNaN(d.getTime())) {
          effectiveFromStr = d.toISOString().split('T')[0];
        }
      } catch (_e) { /* ignore */ }
    }
    setEditForm({
      priceMonthly: p.price_monthly?.toString() || '',
      vehicleSize: p.vehicle_size || 'SEDAN',
      planId: p.plan_id || p.plan?.id || '',
      cityId: p.city_id || p.city?.id || '',
      effectiveFrom: effectiveFromStr,
    });
  };

  const handleSaveEdit = () => {
    if (!editingPricing) return;
    const payload: any = { id: editingPricing.id };
    if (editForm.priceMonthly) payload.priceMonthly = Number(editForm.priceMonthly);
    if (editForm.vehicleSize) payload.vehicleSize = editForm.vehicleSize;
    if (editForm.planId) payload.planId = editForm.planId;
    if (editForm.cityId) payload.cityId = editForm.cityId;
    if (editForm.effectiveFrom) payload.effectiveFrom = editForm.effectiveFrom;
    updateMutation.mutate(payload);
  };

  const cities = citiesData?.data?.data || citiesData?.data || [];
  const cityList = Array.isArray(cities) ? cities : [];
  const plans = plansData?.data?.data || plansData?.data || [];
  const planList = Array.isArray(plans) ? plans : [];
  const pricing = pricingData?.data?.data || pricingData?.data || [];
  const pricingList = Array.isArray(pricing) ? pricing : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Pricing Engine</h1>
          <p className="text-sm text-gray-500 mt-1">City × Vehicle × Plan pricing matrix (All prices include 18% GST)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPlansModal(true)}
            className="px-4 py-2 border border-surface-border text-autozy-charcoal rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Manage Plans
          </button>
          {selectedCity && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-medium text-sm hover:bg-yellow-400 transition-colors"
            >
              {showCreate ? 'Cancel' : '+ Add Pricing'}
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white text-sm"
        >
          <option value="">All Cities</option>
          {cityList.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {selectedCity 
            ? `${pricingList.length} pricing rules in this city` 
            : `Total ${pricingList.length} pricing rules across all cities`}
        </span>
      </div>

      {showCreate && selectedCity && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold mb-4">Add Pricing Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={form.planId}
              onChange={(e) => setForm({ ...form, planId: e.target.value })}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              <option value="">Select Plan</option>
              {planList.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={form.vehicleSize}
              onChange={(e) => setForm({ ...form, vehicleSize: e.target.value })}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              {VEHICLE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              type="number"
              value={form.priceMonthly}
              onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })}
              placeholder="Monthly price (₹)"
              className="px-4 py-2 border rounded-lg text-sm"
            />
            <input
              type="date"
              value={form.effectiveFrom}
              onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
              className="px-4 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={() => createMutation.mutate({ ...form, cityId: selectedCity, priceMonthly: Number(form.priceMonthly) })}
              disabled={!form.planId || !form.priceMonthly || createMutation.isPending}
              className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg text-sm font-medium disabled:opacity-40"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-autozy-charcoal">Pricing Matrix</h3>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : pricingList.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No pricing rules found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">City</th>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Vehicle Size</th>
                    <th className="px-4 py-3 text-left">Monthly Price (incl. GST)</th>
                    <th className="px-4 py-3 text-left">Effective From</th>
                    <th className="px-4 py-3 text-left">Area</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                   {pricingList.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-autozy-charcoal">{p.city?.name || 'Global'}</td>
                      <td className="px-4 py-3 font-medium">{p.plan?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{p.vehicle_size}</Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold text-green-700">
                        ₹{Number(p.price_monthly || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.effective_from ? new Date(p.effective_from).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.area?.name || 'All Areas'}
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => handleEditPricing(p)}
                          className="text-autozy-yellow hover:text-yellow-600 font-medium text-xs underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Pricing Edit Modal — All fields editable */}
      {editingPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-pop overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-surface-border">
              <h3 className="text-lg font-bold text-autozy-charcoal">Edit Pricing</h3>
              <p className="text-xs text-gray-500 mt-1">
                {editingPricing.city?.name || 'Global'} • {editingPricing.plan?.name} • {editingPricing.vehicle_size}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Plan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Plan</label>
                <select
                  value={editForm.planId || ''}
                  onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 outline-none"
                >
                  <option value="">Select Plan</option>
                  {planList.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Vehicle Size */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vehicle Size</label>
                <select
                  value={editForm.vehicleSize || ''}
                  onChange={(e) => setEditForm({ ...editForm, vehicleSize: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 outline-none"
                >
                  {VEHICLE_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">City</label>
                <select
                  value={editForm.cityId || ''}
                  onChange={(e) => setEditForm({ ...editForm, cityId: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 outline-none"
                >
                  <option value="">Select City</option>
                  {cityList.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Monthly Price */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Monthly Price (₹ incl. GST)</label>
                <input
                  type="number"
                  value={editForm.priceMonthly || ''}
                  onChange={(e) => setEditForm({ ...editForm, priceMonthly: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 outline-none"
                />
              </div>

              {/* Effective From */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Effective From</label>
                <input
                  type="date"
                  value={editForm.effectiveFrom || ''}
                  onChange={(e) => setEditForm({ ...editForm, effectiveFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-border rounded-lg text-sm focus:border-autozy-yellow focus:ring-2 focus:ring-autozy-yellow/20 outline-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-muted border-t border-surface-border flex justify-end gap-3">
              <button
                onClick={() => setEditingPricing(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending || !editForm.priceMonthly}
                className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-medium text-sm disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Plans Modal */}
      {showPlansModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-pop overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-autozy-charcoal">Subscription Plans</h3>
                <p className="text-xs text-gray-500 mt-1">Add or edit base plans</p>
              </div>
              <button onClick={() => setShowPlansModal(false)} className="text-gray-400 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h4 className="font-semibold text-sm mb-4">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Plan Name</label>
                    <input
                      type="text"
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="e.g. REGULAR_CLEANING"
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-autozy-yellow focus:ring-1 focus:ring-autozy-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                    <input
                      type="text"
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      placeholder="Short description"
                      className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-autozy-yellow focus:ring-1 focus:ring-autozy-yellow"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => {
                      if (editingPlan) {
                        updatePlanMutation.mutate({ id: editingPlan.id, ...planForm });
                      } else {
                        createPlanMutation.mutate(planForm);
                      }
                    }}
                    disabled={!planForm.name || createPlanMutation.isPending || updatePlanMutation.isPending}
                    className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                  {editingPlan && (
                    <button
                      onClick={() => { setEditingPlan(null); setPlanForm({ name: '', description: '' }); }}
                      className="px-4 py-2 border text-gray-600 rounded-lg text-sm font-medium"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>

              <h4 className="font-semibold text-sm mb-4">Existing Plans</h4>
              <div className="grid grid-cols-1 gap-3">
                {planList.map((plan: any) => (
                  <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-autozy-yellow/50 transition-colors">
                    <div>
                      <p className="font-medium text-sm text-autozy-charcoal">{plan.name}</p>
                      <p className="text-xs text-gray-500">{plan.description || 'No description'}</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setPlanForm({ name: plan.name, description: plan.description || '' });
                      }}
                      className="text-xs font-semibold text-autozy-yellow hover:text-yellow-600"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
