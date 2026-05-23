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
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ maxCapacity: 100, pincode: '', isActive: true });
  const [localCapacities, setLocalCapacities] = useState<Record<string, number>>({});
  const [editingCapacityAreaId, setEditingCapacityAreaId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityStatusFilter, setCityStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [areaStatusFilter, setAreaStatusFilter] = useState<string>('all');
  const [onboardingFilter, setOnboardingFilter] = useState<'all' | 'open' | 'paused'>('all');

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

  const updateAreaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => areasApi.updateArea(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      setEditingAreaId(null);
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

  const handleCapacityBlur = (areaId: string, currentMaxCapacity: number, isActive: boolean) => {
    const val = localCapacities[areaId] !== undefined ? localCapacities[areaId] : currentMaxCapacity;
    if (val !== currentMaxCapacity) {
      setEditingCapacityAreaId(areaId);
      updateAreaMutation.mutate(
        { id: areaId, data: { maxCapacity: val, isActive } },
        {
          onSuccess: () => {
            setEditingCapacityAreaId(null);
          },
          onError: () => {
            setEditingCapacityAreaId(null);
            // Reset local capacity back to current server value on error
            setLocalCapacities((prev) => {
              const next = { ...prev };
              delete next[areaId];
              return next;
            });
          }
        }
      );
    }
  };

  const cities = citiesData?.data?.data || citiesData?.data || [];
  const cityList = Array.isArray(cities) ? cities : [];

  const filteredCityList = cityList.map((city: any) => {
    // 1. Filter City Status
    if (cityStatusFilter === 'active' && !city.is_active) return null;
    if (cityStatusFilter === 'inactive' && city.is_active) return null;

    // 2. Filter Areas within City
    const matchingAreas = (city.areas || []).filter((area: any) => {
      // Filter Area Status
      if (areaStatusFilter !== 'all' && area.status !== areaStatusFilter) return false;

      // Filter Onboarding Status
      if (onboardingFilter === 'open' && area.is_onboarding_paused) return false;
      if (onboardingFilter === 'paused' && !area.is_onboarding_paused) return false;

      // Filter Search Query on Area Name
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const areaNameMatch = area.name?.toLowerCase().includes(query);
        const areaPincodeMatch = area.pincode?.toLowerCase().includes(query);
        return areaNameMatch || areaPincodeMatch;
      }

      return true;
    });

    // 3. Filter Search Query on City Name/State
    const query = searchQuery.toLowerCase();
    const cityNameMatch = city.name?.toLowerCase().includes(query);
    const cityStateMatch = city.state?.toLowerCase().includes(query);
    const hasMatchingAreas = matchingAreas.length > 0;

    // If there is a search query, show city if its name/state matches or if it has matching areas
    if (searchQuery && !cityNameMatch && !cityStateMatch && !hasMatchingAreas) {
      return null;
    }

    // Return the city with only matching areas
    return {
      ...city,
      areas: matchingAreas,
    };
  }).filter(Boolean) as any[];

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

      {/* Search & Filters Section */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          
          {/* Search Bar & Button Container */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setSearchQuery(searchInput);
            }}
            className="flex items-center gap-2 flex-1 max-w-lg"
          >
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by City, Area or Pincode..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow focus:border-transparent transition-all duration-200 bg-gray-50/50 hover:bg-gray-50 font-medium text-autozy-charcoal"
              />
              {(searchInput || searchQuery) && (
                <button 
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-autozy-yellow text-autozy-dark hover:bg-yellow-400 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 whitespace-nowrap"
            >
              Search
            </button>
          </form>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* City Status Filter */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">City Status</span>
              <select
                value={cityStatusFilter}
                onChange={(e) => setCityStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow transition-all duration-200 text-gray-700 font-medium cursor-pointer hover:border-gray-300"
              >
                <option value="all">All Cities</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Area Status Filter */}
            <div className="flex flex-col gap-1 min-w-[140px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Area Status</span>
              <select
                value={areaStatusFilter}
                onChange={(e) => setAreaStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow transition-all duration-200 text-gray-700 font-medium cursor-pointer hover:border-gray-300"
              >
                <option value="all">All Areas</option>
                <option value="AVAILABLE">Available</option>
                <option value="FULL">Full</option>
                <option value="COMING_SOON">Coming Soon</option>
              </select>
            </div>

            {/* Onboarding Filter */}
            <div className="flex flex-col gap-1 min-w-[145px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Onboarding</span>
              <select
                value={onboardingFilter}
                onChange={(e) => setOnboardingFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow transition-all duration-200 text-gray-700 font-medium cursor-pointer hover:border-gray-300"
              >
                <option value="all">All Onboarding</option>
                <option value="open">Open</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            {/* Reset Button */}
            {(searchInput || searchQuery || cityStatusFilter !== 'all' || areaStatusFilter !== 'all' || onboardingFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchQuery('');
                  setCityStatusFilter('all');
                  setAreaStatusFilter('all');
                  setOnboardingFilter('all');
                }}
                className="px-4 py-2 border border-dashed border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-1.5 animate-fadeIn"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
                Clear Filters
              </button>
            )}
          </div>
          
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="bg-white rounded-xl p-6 h-32 animate-pulse" />)}
        </div>
      ) : cityList.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
          No cities configured. Add a city to get started.
        </div>
      ) : filteredCityList.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <svg className="w-8 h-8 text-autozy-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-autozy-charcoal mb-1">No Matching Results</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
            We couldn't find any cities or areas matching your active filters. Try expanding your search!
          </p>
          <button
            onClick={() => {
              setSearchInput('');
              setSearchQuery('');
              setCityStatusFilter('all');
              setAreaStatusFilter('all');
              setOnboardingFilter('all');
            }}
            className="px-5 py-2.5 bg-autozy-yellow text-autozy-dark rounded-xl font-semibold text-sm hover:bg-yellow-400 transition-all duration-200 shadow-sm hover:shadow"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCityList.map((city: any) => (
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
                <div className="p-6 bg-gray-50 border-b border-gray-100 transition-all duration-300">
                  <h4 className="text-xs uppercase font-extrabold text-autozy-charcoal/80 tracking-wider mb-4">
                    Add New Service Area to {city.name}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    
                    {/* Area Name Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Area Name</label>
                      <input 
                        type="text"
                        value={areaForm.name} 
                        onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} 
                        placeholder="e.g. Gachibowli" 
                        className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow transition-all bg-white font-medium text-autozy-charcoal placeholder-gray-400"
                      />
                    </div>

                    {/* Pincode Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Pincode</label>
                      <input 
                        type="text"
                        value={areaForm.pincode} 
                        onChange={(e) => setAreaForm({ ...areaForm, pincode: e.target.value })} 
                        placeholder="e.g. 500032" 
                        className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow transition-all bg-white font-medium text-autozy-charcoal placeholder-gray-400"
                      />
                    </div>

                    {/* Latitude Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Latitude</label>
                      <input 
                        type="number" 
                        step="any"
                        value={areaForm.centerLat} 
                        onChange={(e) => setAreaForm({ ...areaForm, centerLat: e.target.value })} 
                        placeholder="e.g. 17.448" 
                        className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow transition-all bg-white font-medium text-autozy-charcoal placeholder-gray-400"
                      />
                    </div>

                    {/* Longitude Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Longitude</label>
                      <input 
                        type="number" 
                        step="any"
                        value={areaForm.centerLng} 
                        onChange={(e) => setAreaForm({ ...areaForm, centerLng: e.target.value })} 
                        placeholder="e.g. 78.374" 
                        className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow transition-all bg-white font-medium text-autozy-charcoal placeholder-gray-400"
                      />
                    </div>

                    {/* Radius Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Radius (km)</label>
                      <input 
                        type="number" 
                        value={areaForm.radiusKm} 
                        onChange={(e) => setAreaForm({ ...areaForm, radiusKm: +e.target.value })} 
                        placeholder="e.g. 5" 
                        className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow transition-all bg-white font-medium text-autozy-charcoal placeholder-gray-400"
                      />
                    </div>

                    {/* Max Capacity Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Max Capacity</label>
                      <input 
                        type="number" 
                        value={areaForm.maxCapacity} 
                        onChange={(e) => setAreaForm({ ...areaForm, maxCapacity: +e.target.value })} 
                        placeholder="e.g. 500" 
                        className="px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-autozy-yellow transition-all bg-white font-medium text-autozy-charcoal placeholder-gray-400"
                      />
                    </div>

                  </div>

                  <div className="flex justify-end gap-3 mt-5">
                    <button 
                      onClick={() => setShowCreateArea(null)}
                      className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl font-semibold text-sm hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => createAreaMutation.mutate({ 
                        cityId: city.id, 
                        data: { 
                          name: areaForm.name, 
                          pincode: areaForm.pincode, 
                          centerLat: +areaForm.centerLat, 
                          centerLng: +areaForm.centerLng, 
                          radiusKm: areaForm.radiusKm, 
                          maxCapacity: areaForm.maxCapacity 
                        } 
                      })}
                      disabled={!areaForm.name || !areaForm.centerLat || !areaForm.centerLng || createAreaMutation.isPending}
                      className="px-5 py-2 bg-autozy-yellow text-autozy-dark rounded-xl text-sm font-semibold hover:bg-yellow-400 disabled:opacity-40 transition-colors shadow-sm"
                    >
                      {createAreaMutation.isPending ? 'Creating...' : 'Create Area'}
                    </button>
                  </div>
                  {createAreaMutation.isError && (
                    <p className="text-red-500 text-xs mt-2 font-medium">
                      {(createAreaMutation.error as any)?.response?.data?.errors?.join(', ') || 'Failed to create area'}
                    </p>
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
                          <tr key={area.id} className="table-row-hover hover:bg-gray-50/80">
                            <td className="px-4 py-3 font-medium">{area.name}</td>
                            <td className="px-4 py-3 text-gray-500">
                              {editingAreaId === area.id ? (
                                <input
                                  type="text"
                                  value={editForm.pincode}
                                  onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                                  placeholder="Pincode"
                                  className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-autozy-charcoal"
                                />
                              ) : (
                                area.pincode || '-'
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {editingAreaId === area.id ? (
                                <select 
                                  value={editForm.isActive ? 'true' : 'false'}
                                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                                  className="px-2 py-1 border rounded text-xs"
                                >
                                  <option value="true">Active</option>
                                  <option value="false">Inactive</option>
                                </select>
                              ) : (
                                <Badge variant={
                                  area.status === 'AVAILABLE' ? 'success' :
                                  area.status === 'FULL' ? 'danger' : 'warning'
                                }>
                                  {area.status} {!area.is_active && '(Inactive)'}
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-medium">{area.current_subscriptions || 0} /</span>
                                <input 
                                  type="number" 
                                  value={
                                    editingAreaId === area.id 
                                      ? editForm.maxCapacity 
                                      : (localCapacities[area.id] !== undefined ? localCapacities[area.id] : area.max_capacity)
                                  }
                                  onChange={(e) => {
                                    if (editingAreaId === area.id) {
                                      setEditForm({ ...editForm, maxCapacity: +e.target.value });
                                    } else {
                                      setLocalCapacities({ ...localCapacities, [area.id]: +e.target.value });
                                    }
                                  }}
                                  onBlur={() => {
                                    if (editingAreaId !== area.id) {
                                      handleCapacityBlur(area.id, area.max_capacity, area.is_active);
                                    }
                                  }}
                                  className="w-20 px-2 py-1 border rounded-lg text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium text-autozy-charcoal"
                                  disabled={updateAreaMutation.isPending && (editingCapacityAreaId === area.id || editingAreaId === area.id)}
                                />
                                {updateAreaMutation.isPending && editingCapacityAreaId === area.id && (
                                  <span className="text-xs text-gray-400 animate-pulse">saving...</span>
                                )}
                              </div>
                            </td>
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
                            <td className="px-4 py-3 flex gap-3 items-center">
                              {editingAreaId === area.id ? (
                                <>
                                  <button
                                    onClick={() => updateAreaMutation.mutate({ 
                                      id: area.id, 
                                      data: { 
                                        maxCapacity: editForm.maxCapacity, 
                                        pincode: editForm.pincode, 
                                        isActive: editForm.isActive 
                                      } 
                                    })}
                                    disabled={updateAreaMutation.isPending}
                                    className="text-blue-600 text-xs font-medium hover:underline disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingAreaId(null)}
                                    className="text-gray-500 text-xs font-medium hover:underline"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => { 
                                      setEditingAreaId(area.id); 
                                      setEditForm({ 
                                        maxCapacity: area.max_capacity, 
                                        pincode: area.pincode || '', 
                                        isActive: area.is_active 
                                      }); 
                                    }}
                                    className="text-blue-600 text-xs font-medium hover:underline"
                                  >
                                    Edit
                                  </button>
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
                                </>
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
