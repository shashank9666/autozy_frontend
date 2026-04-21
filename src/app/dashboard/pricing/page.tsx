'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pricingApi, areasApi, plansApi } from '@/lib/api';
import Badge from '@/components/Badge';

const VEHICLE_SIZES = ['SMALL', 'SEDAN', 'LARGE'];

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [selectedCity, setSelectedCity] = useState('');
  const [showCreate, setShowCreate] = useState(false);
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
    // enabled: true by default
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => pricingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      setShowCreate(false);
      setForm({ planId: '', vehicleSize: 'SEDAN', priceMonthly: '', effectiveFrom: new Date().toISOString().split('T')[0] });
    },
  });

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
          <p className="text-sm text-gray-500 mt-1">City x Vehicle x Plan pricing matrix</p>
        </div>
        {selectedCity && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-medium text-sm hover:bg-yellow-400 transition-colors"
          >
            {showCreate ? 'Cancel' : '+ Add Pricing'}
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-4">
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white text-sm"
        >
          <option value="">Select City</option>
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

      {/* No placeholder needed anymore since we show all data by default */}
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
                    <th className="px-4 py-3 text-left">Monthly Price</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Effective From</th>
                    <th className="px-4 py-3 text-left">Effective To</th>
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
                      <td className="px-4 py-3">
                        <Badge variant={p.effective_to ? 'danger' : 'success'}>
                          {p.effective_to ? 'Expired' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.effective_from ? new Date(p.effective_from).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.effective_to ? new Date(p.effective_to).toLocaleDateString('en-IN') : 'Ongoing'}
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
