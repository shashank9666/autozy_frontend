'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addonsApi } from '@/lib/api';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';

type Tab = 'catalog' | 'bookings' | 'kpis';

export default function AddonsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('catalog');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    vehicleSizes: 'HATCHBACK,SEDAN,SUV,MUV',
    estimatedDurationMinutes: 60,
  });

  const { data: catalogData, isLoading: catalogLoading } = useQuery({
    queryKey: ['addon-catalog'],
    queryFn: () => addonsApi.getCatalog(),
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['addon-bookings'],
    queryFn: () => addonsApi.getBookings({ page: 1, limit: 50 }),
    enabled: activeTab === 'bookings',
  });

  const catalog = catalogData?.data?.data || catalogData?.data || [];
  const catalogList = Array.isArray(catalog) ? catalog : [];

  const bookings = bookingsData?.data?.data?.items || bookingsData?.data?.data || bookingsData?.data?.items || [];
  const bookingsList = Array.isArray(bookings) ? bookings : [];

  const createMutation = useMutation({
    mutationFn: (data: any) => addonsApi.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-catalog'] });
      setShowCreateForm(false);
      setForm({ name: '', description: '', vehicleSizes: 'HATCHBACK,SEDAN,SUV,MUV', estimatedDurationMinutes: 60 });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: form.name,
      description: form.description,
      vehicleSizes: form.vehicleSizes.split(',').map((s) => s.trim()),
      estimatedDurationMinutes: form.estimatedDurationMinutes,
    });
  };

  const completedBookings = bookingsList.filter((b: any) => b.status === 'COMPLETED');
  const avgRating =
    completedBookings.length > 0
      ? (completedBookings.reduce((sum: number, b: any) => sum + (b.rating || 0), 0) / completedBookings.length).toFixed(1)
      : '0';

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
      COMPLETED: 'success',
      SCHEDULED: 'info',
      IN_PROGRESS: 'warning',
      CANCELLED: 'danger',
      AUDIT_PASS: 'success',
      AUDIT_FAIL: 'danger',
      REWORK: 'warning',
    };
    return <Badge variant={map[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'catalog', label: 'Service Catalog' },
    { key: 'bookings', label: 'Bookings' },
    { key: 'kpis', label: 'KPIs' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Add-On Services</h1>
          <p className="text-sm text-gray-500 mt-1">Manage specialist services & bookings</p>
        </div>
        {activeTab === 'catalog' && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-medium text-sm hover:bg-yellow-400 transition-colors"
          >
            {showCreateForm ? 'Cancel' : '+ Add Service'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-autozy-charcoal shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showCreateForm && activeTab === 'catalog' && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold mb-4">Create Add-On Service</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              placeholder="Service name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2 border rounded-lg text-sm"
            />
            <input
              placeholder="Duration (minutes)"
              type="number"
              value={form.estimatedDurationMinutes}
              onChange={(e) => setForm({ ...form, estimatedDurationMinutes: +e.target.value })}
              className="px-4 py-2 border rounded-lg text-sm"
            />
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="px-4 py-2 border rounded-lg text-sm md:col-span-2"
            />
            <input
              placeholder="Vehicle sizes (comma separated)"
              value={form.vehicleSizes}
              onChange={(e) => setForm({ ...form, vehicleSizes: e.target.value })}
              className="px-4 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={handleCreate}
              disabled={!form.name || createMutation.isPending}
              className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg text-sm font-medium disabled:opacity-40"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Service'}
            </button>
          </div>
        </div>
      )}

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-autozy-charcoal">Service Catalog ({catalogList.length})</h3>
          </div>
          {catalogLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : catalogList.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No add-on services configured</div>
          ) : (
            <div className="divide-y">
              {catalogList.map((svc: any) => (
                <div key={svc.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{svc.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{svc.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{svc.estimatedDurationMinutes || svc.estimated_duration_minutes || '-'} min</span>
                    <div className="flex gap-1">
                      {(svc.vehicleSizes || svc.vehicle_sizes || []).map((size: string) => (
                        <span key={size} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{size}</span>
                      ))}
                    </div>
                    <Badge variant={svc.isActive !== false ? 'success' : 'danger'}>
                      {svc.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-autozy-charcoal">Bookings ({bookingsList.length})</h3>
          </div>
          {bookingsLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : bookingsList.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No bookings found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Vehicle</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Audit</th>
                    <th className="px-4 py-3 text-left">Scheduled</th>
                    <th className="px-4 py-3 text-left">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookingsList.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{booking.id?.slice(0, 8)}...</td>
                      <td className="px-4 py-3 font-medium">{booking.addonService?.name || booking.addon_service?.name || '-'}</td>
                      <td className="px-4 py-3">{booking.vehicle?.vehicle_number || '-'}</td>
                      <td className="px-4 py-3">{statusBadge(booking.status)}</td>
                      <td className="px-4 py-3">
                        {booking.auditStatus || booking.audit_status
                          ? statusBadge(booking.auditStatus || booking.audit_status)
                          : <span className="text-gray-400 text-xs">-</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {booking.scheduled_date ? new Date(booking.scheduled_date).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {booking.rating ? (
                          <span className="text-yellow-600 font-medium text-xs">{booking.rating}/5</span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* KPIs Tab */}
      {activeTab === 'kpis' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Bookings" value={bookingsList.length} color="yellow" />
            <StatCard title="Completed" value={completedBookings.length} color="green" />
            <StatCard title="Avg Rating" value={avgRating} color="blue" />
            <StatCard
              title="Rework Rate"
              value={`${bookingsList.length > 0 ? ((bookingsList.filter((b: any) => (b.auditStatus || b.audit_status) === 'REWORK').length / bookingsList.length) * 100).toFixed(1) : 0}%`}
              color="red"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-autozy-charcoal mb-4">Service Performance</h3>
            <div className="space-y-4">
              {catalogList.map((svc: any) => {
                const svcBookings = bookingsList.filter((b: any) => (b.addon_service_id || b.addonServiceId) === svc.id);
                const svcCompleted = svcBookings.filter((b: any) => b.status === 'COMPLETED').length;
                return (
                  <div key={svc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{svc.name}</p>
                      <p className="text-xs text-gray-500">{svcBookings.length} bookings, {svcCompleted} completed</p>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${svcBookings.length > 0 ? (svcCompleted / svcBookings.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {catalogList.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">No service data available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
