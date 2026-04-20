'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi, paymentsApi, dashboardApi } from '@/lib/api';
import StatCard from '@/components/StatCard';

export default function ReportsPage() {
  const { data: opsData } = useQuery({
    queryKey: ['ops-dashboard'],
    queryFn: () => dashboardApi.getOperations(),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-report'],
    queryFn: () => paymentsApi.getAll({ page: 1, limit: 100 }),
  });

  const stats = opsData?.data?.data || opsData?.data || {};
  const payments = revenueData?.data?.data?.items || revenueData?.data?.data || revenueData?.data?.items || [];
  const paymentsList = Array.isArray(payments) ? payments : [];

  const totalRevenue = paymentsList
    .filter((p: any) => p.status === 'COMPLETED')
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

  const totalGst = paymentsList
    .filter((p: any) => p.status === 'COMPLETED')
    .reduce((sum: number, p: any) => sum + (Number(p.gst_amount) || 0), 0);

  const completedPayments = paymentsList.filter((p: any) => p.status === 'COMPLETED').length;
  const refundedPayments = paymentsList.filter((p: any) => p.status === 'REFUNDED').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-autozy-charcoal">Reports & Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Business metrics and performance insights</p>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} color="green" />
        <StatCard title="GST Collected" value={`₹${totalGst.toLocaleString('en-IN')}`} color="blue" />
        <StatCard title="Transactions" value={completedPayments} color="yellow" />
        <StatCard title="Refunds" value={refundedPayments} color="red" />
      </div>

      {/* Operations Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-autozy-charcoal mb-4">Operations Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">SLA Compliance</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${stats.slaCompliance || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{stats.slaCompliance || 0}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">CNA Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${stats.cnaPercent || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{stats.cnaPercent || 0}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Missed Rate</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-red-500 rounded-full"
                    style={{ width: `${stats.missedPercent || 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{stats.missedPercent || 0}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-autozy-charcoal mb-4">Service Breakdown Today</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.cleaned || 0}</p>
              <p className="text-xs text-green-600 mt-1">Cleaned</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{stats.cna || 0}</p>
              <p className="text-xs text-blue-600 mt-1">CNA</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats.missed || 0}</p>
              <p className="text-xs text-red-600 mt-1">Missed</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
              <p className="text-xs text-yellow-600 mt-1">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-autozy-charcoal">Recent Transactions</h3>
        </div>
        {paymentsList.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No transaction data available</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">GST</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Gateway</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paymentsList.slice(0, 20).map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{p.invoice_number}</td>
                    <td className="px-4 py-3 font-medium">₹{Number(p.amount)?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-gray-500">₹{Number(p.gst_amount)?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                        p.status === 'REFUNDED' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.payment_gateway}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '-'}
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
