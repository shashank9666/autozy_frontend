'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { areasApi } from '@/lib/api';
import { useState } from 'react';
import Badge from '@/components/Badge';

export default function AreasPage() {
  const queryClient = useQueryClient();
  const [showCreateCity, setShowCreateCity] = useState(false);
  const [showCreateArea, setShowCreateArea] = useState<string | null>(null);
  const [cityName, setCityName] = useState('');
  const [cityState, setCityState] = useState('');
  const [areaForm, setAreaForm] = useState({ name: '', maxCapacity: 100, pincode: '', centerLat: '', centerLng: '', radiusKm: 3 });

  const { data: citiesData, isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: () => areasApi.getCities(),
  });

  const createCityMutation = useMutation({
    mutationFn: (data: any) => areasApi.createCity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      setShowCreateCity(false);
      setCityName('');
      setCityState('');
    },
  });

  const createAreaMutation = useMutation({
    mutationFn: ({ cityId, data }: { cityId: string; data: any }) => areasApi.createArea({ ...data, cityId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      setShowCreateArea(null);
      setAreaForm({ name: '', maxCapacity: 100, pincode: '', centerLat: '', centerLng: '', radiusKm: 3 });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => areasApi.pauseArea(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cities'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => areasApi.resumeArea(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cities'] }),
  });

  const cities = citiesData?.data?.data || citiesData?.data || [];
  const cityList = Array.isArray(cities) ? cities : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Cities & Areas</h1>
          <p className="text-sm text-gray-500 mt-1">Manage service areas & capacity</p>
        </div>
        <button
          onClick={() => setShowCreateCity(!showCreateCity)}
          className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-medium text-sm hover:bg-yellow-400 transition-colors"
        >
          {showCreateCity ? 'Cancel' : '+ Add City'}
        </button>
      </div>

      {showCreateCity && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold mb-4">Create City</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input value={cityName} onChange={(e) => setCityName(e.target.value)} placeholder="City name" className="px-4 py-2 border rounded-lg text-sm" />
            <input value={cityState} onChange={(e) => setCityState(e.target.value)} placeholder="State" className="px-4 py-2 border rounded-lg text-sm" />
            <div className="flex gap-2">
              <button
                onClick={() => createCityMutation.mutate({ name: cityName, state: cityState })}
                disabled={!cityName || !cityState || createCityMutation.isPending}
                className="px-6 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-medium text-sm disabled:opacity-40"
              >
                {createCityMutation.isPending ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowCreateCity(false)} className="px-4 py-2 text-gray-500 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="bg-white rounded-xl p-6 h-32 animate-pulse" />)}
        </div>
      ) : cityList.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
          No cities configured. Add a city to get started.
        </div>
      ) : (
        <div className="space-y-6">
          {cityList.map((city: any) => (
            <div key={city.id} className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-autozy-charcoal">{city.name}</h2>
                  <span className="text-sm text-gray-500">{city.state}</span>
                  <Badge variant={city.is_active ? 'success' : 'danger'}>
                    {city.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <button
                  onClick={() => setShowCreateArea(showCreateArea === city.id ? null : city.id)}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  + Add Area
                </button>
              </div>

              {showCreateArea === city.id && (
                <div className="p-4 bg-gray-50 border-b">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <input value={areaForm.name} onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} placeholder="Area name" className="px-3 py-2 border rounded-lg text-sm" />
                    <input value={areaForm.pincode} onChange={(e) => setAreaForm({ ...areaForm, pincode: e.target.value })} placeholder="Pincode" className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="number" value={areaForm.centerLat} onChange={(e) => setAreaForm({ ...areaForm, centerLat: e.target.value })} placeholder="Latitude" className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="number" value={areaForm.centerLng} onChange={(e) => setAreaForm({ ...areaForm, centerLng: e.target.value })} placeholder="Longitude" className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="number" value={areaForm.radiusKm} onChange={(e) => setAreaForm({ ...areaForm, radiusKm: +e.target.value })} placeholder="Radius (km)" className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="number" value={areaForm.maxCapacity} onChange={(e) => setAreaForm({ ...areaForm, maxCapacity: +e.target.value })} placeholder="Max capacity" className="px-3 py-2 border rounded-lg text-sm" />
                    <button
                      onClick={() => createAreaMutation.mutate({ cityId: city.id, data: { name: areaForm.name, centerLat: +areaForm.centerLat, centerLng: +areaForm.centerLng, radiusKm: areaForm.radiusKm, maxCapacity: areaForm.maxCapacity } })}
                      disabled={!areaForm.name || !areaForm.centerLat || !areaForm.centerLng || createAreaMutation.isPending}
                      className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg text-sm font-medium disabled:opacity-40"
                    >
                      {createAreaMutation.isPending ? 'Creating...' : 'Create Area'}
                    </button>
                  </div>
                  {createAreaMutation.isError && (
                    <p className="text-red-500 text-xs mt-2">{(createAreaMutation.error as any)?.response?.data?.errors?.join(', ') || 'Failed'}</p>
                  )}
                </div>
              )}

              {city.areas?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Area</th>
                        <th className="px-4 py-3 text-left">Pincode</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Capacity</th>
                        <th className="px-4 py-3 text-left">Utilization</th>
                        <th className="px-4 py-3 text-left">Onboarding</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {city.areas.map((area: any) => {
                        const utilization = area.max_capacity > 0
                          ? Math.round((area.current_subscriptions / area.max_capacity) * 100)
                          : 0;
                        return (
                          <tr key={area.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{area.name}</td>
                            <td className="px-4 py-3 text-gray-500">{area.pincode || '-'}</td>
                            <td className="px-4 py-3">
                              <Badge variant={
                                area.status === 'AVAILABLE' ? 'success' :
                                area.status === 'FULL' ? 'danger' : 'warning'
                              }>
                                {area.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">{area.current_subscriptions || 0} / {area.max_capacity}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 rounded-full">
                                  <div
                                    className={`h-2 rounded-full ${utilization > 90 ? 'bg-red-500' : utilization > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(utilization, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">{utilization}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={area.is_onboarding_paused ? 'danger' : 'success'}>
                                {area.is_onboarding_paused ? 'Paused' : 'Open'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {area.is_onboarding_paused ? (
                                <button
                                  onClick={() => resumeMutation.mutate(area.id)}
                                  className="text-green-600 text-xs font-medium hover:underline"
                                >
                                  Resume
                                </button>
                              ) : (
                                <button
                                  onClick={() => pauseMutation.mutate(area.id)}
                                  className="text-red-600 text-xs font-medium hover:underline"
                                >
                                  Pause
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 text-sm">No areas configured yet</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
