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
  
  // Search and Pagination States
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
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

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => plansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete plan');
    }
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

  // Filter pricing matrix locally by search query
  const filteredPricingList = pricingList.filter((p: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.city?.name?.toLowerCase().includes(query) ||
      p.plan?.name?.toLowerCase().includes(query) ||
      p.vehicle_size?.toLowerCase().includes(query) ||
      p.area?.name?.toLowerCase().includes(query)
    );
  });

  // Paginate the filtered list
  const totalPages = Math.ceil(filteredPricingList.length / ITEMS_PER_PAGE);
  const paginatedPricingList = filteredPricingList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          
          {/* City & Search Bar Container */}
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="flex flex-col gap-1 min-w-[150px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">City</span>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow font-medium cursor-pointer hover:border-gray-300"
              >
                <option value="">All Cities</option>
                {cityList.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Search Input & Button */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setSearchQuery(searchInput);
                setCurrentPage(1);
              }}
              className="flex items-end gap-2 flex-1 max-w-lg mt-auto"
            >
              <div className="flex flex-col gap-1 flex-1 relative">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Search Rules</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by City, Plan or Vehicle Size..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow focus:border-transparent transition-all bg-gray-50/50 hover:bg-gray-50 font-medium text-autozy-charcoal"
                  />
                  {(searchInput || searchQuery) && (
                    <button 
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-autozy-yellow text-autozy-dark hover:bg-yellow-400 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 whitespace-nowrap h-[42px] flex items-center"
              >
                Search
              </button>
            </form>
          </div>

          <div className="text-right mt-auto lg:mt-0 flex flex-col justify-end">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Pricing Rules Count</span>
            <span className="text-sm font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 inline-block self-end">
              {selectedCity 
                ? `${filteredPricingList.length} pricing rules in this city` 
                : `Total ${filteredPricingList.length} pricing rules`}
            </span>
          </div>

        </div>
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
          ) : filteredPricingList.length === 0 ? (
            <div className="p-16 text-center border-t border-gray-100 transition-all duration-300">
              <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <svg className="w-8 h-8 text-autozy-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-autozy-charcoal mb-1">No Matching Pricing Rules</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
                We couldn't find any pricing rules matching "{searchQuery}". Try a different term or clear filters!
              </p>
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="px-5 py-2.5 bg-autozy-yellow text-autozy-dark rounded-xl font-semibold text-sm hover:bg-yellow-400 transition-all duration-200 shadow-sm hover:shadow"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div>
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
                     {paginatedPricingList.map((p: any) => (
                      <tr key={p.id} className="table-row-hover hover:bg-gray-50/80">
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
                            className="text-autozy-yellow hover:text-yellow-600 font-medium text-xs underline active-press"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-medium">
                    Page {currentPage} of {totalPages} ({filteredPricingList.length} total)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="px-4 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-xl disabled:opacity-40 hover:bg-gray-50 font-semibold transition-all active-press"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={currentPage >= totalPages}
                      className="px-4 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-xl disabled:opacity-40 hover:bg-gray-50 font-semibold transition-all active-press"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
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
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setPlanForm({ name: plan.name, description: plan.description || '' });
                        }}
                        className="text-xs font-semibold text-autozy-yellow hover:text-yellow-600"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300 text-xs select-none">|</span>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the plan "${plan.name}"? This action cannot be undone.`)) {
                            deletePlanMutation.mutate(plan.id);
                          }
                        }}
                        disabled={deletePlanMutation.isPending}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </div>
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
