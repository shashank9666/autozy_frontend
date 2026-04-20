'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, expensesApi } from '@/lib/api';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import ExportButton from '@/components/ExportButton';
import { exportAllPages } from '@/lib/export';

const EXPENSE_CATEGORIES = [
  'STAFF_SALARY', 'EQUIPMENT', 'CONSUMABLES', 'VEHICLE_MAINTENANCE', 'RENT', 'MARKETING', 'OTHER',
];

const CATEGORY_LABELS: Record<string, string> = {
  STAFF_SALARY: 'Staff Salary',
  EQUIPMENT: 'Equipment',
  CONSUMABLES: 'Consumables',
  VEHICLE_MAINTENANCE: 'Vehicle Maintenance',
  RENT: 'Rent',
  MARKETING: 'Marketing',
  OTHER: 'Other',
};

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'transactions' | 'expenses'>('transactions');
  const [page, setPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [expenseCategory, setExpenseCategory] = useState('');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'OTHER',
    amount: '',
    description: '',
    vendorName: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });

  // Transactions query
  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: () => paymentsApi.getAll({ page, limit: 20 }),
  });

  // Expenses query
  const { data: expData, isLoading: expLoading } = useQuery({
    queryKey: ['expenses', expensePage, expenseCategory],
    queryFn: () => expensesApi.getAll({ page: expensePage, limit: 20, category: expenseCategory || undefined }),
  });

  // Expense summary
  const { data: summaryData } = useQuery({
    queryKey: ['expenses-summary'],
    queryFn: () => expensesApi.getSummary(),
  });

  const refundMutation = useMutation({
    mutationFn: ({ paymentId, amount }: { paymentId: string; amount: number }) =>
      paymentsApi.refund(paymentId, amount, 'Admin initiated refund'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payments'] }),
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: any) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      setShowExpenseForm(false);
      setExpenseForm({ category: 'OTHER', amount: '', description: '', vendorName: '', expenseDate: new Date().toISOString().split('T')[0] });
    },
  });

  const payments = data?.data?.data?.items || data?.data?.data || data?.data?.items || [];
  const paymentsList = Array.isArray(payments) ? payments : [];
  const meta = data?.data?.meta || data?.data?.data?.meta || {};

  const expenses = expData?.data?.data?.items || expData?.data?.data || expData?.data?.items || [];
  const expensesList = Array.isArray(expenses) ? expenses : [];
  const expMeta = expData?.data?.meta || expData?.data?.data?.meta || {};

  const summary = summaryData?.data?.data || [];
  const totalExpenses = summary.reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);

  const totalRevenue = paymentsList
    .filter((p: any) => p.status === 'COMPLETED')
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const totalGst = paymentsList
    .filter((p: any) => p.status === 'COMPLETED')
    .reduce((sum: number, p: any) => sum + Number(p.gst_amount || 0), 0);
  const refundedCount = paymentsList.filter((p: any) => p.status === 'REFUNDED').length;

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
      COMPLETED: 'success', PENDING: 'warning', REFUNDED: 'info', FAILED: 'danger',
    };
    return <Badge variant={map[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-autozy-charcoal">Finance & Payments</h1>
        <p className="text-sm text-gray-500 mt-1">Transactions, revenue tracking & expense management</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {(['transactions', 'expenses'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-autozy-blue text-autozy-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'transactions' ? 'Transactions' : 'Expenses'}
          </button>
        ))}
      </div>

      {/* ── TRANSACTIONS TAB ── */}
      {activeTab === 'transactions' && (
        <>
          <div className="flex justify-end mb-4">
            <ExportButton
              onClick={async () => {
                try {
                  await exportAllPages(
                    (p, l) => paymentsApi.getAll({ page: p, limit: l }),
                    [
                      { key: 'invoice_number', header: 'Invoice' },
                      { key: 'user.name', header: 'Customer', transform: (v, r) => v || r.user?.phone || '-' },
                      { key: 'amount', header: 'Amount', transform: (v) => Number(v || 0) },
                      { key: 'gst_amount', header: 'GST', transform: (v) => Number(v || 0) },
                      { key: 'payment_gateway', header: 'Gateway' },
                      { key: 'status', header: 'Status' },
                      { key: 'created_at', header: 'Date', transform: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '-' },
                    ],
                    'payments',
                  );
                } catch (e: any) { alert(e.message); }
              }}
              disabled={isLoading || paymentsList.length === 0}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} color="green" />
            <StatCard title="GST Collected" value={`₹${totalGst.toLocaleString('en-IN')}`} color="blue" />
            <StatCard title="Transactions" value={paymentsList.length} color="yellow" />
            <StatCard title="Refunds" value={refundedCount} color="red" />
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-autozy-charcoal">Transactions</h3>
            </div>

            {isLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : paymentsList.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No payments found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Invoice</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Amount</th>
                      <th className="px-4 py-3 text-left">GST</th>
                      <th className="px-4 py-3 text-left">Gateway</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paymentsList.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs">{p.invoice_number}</td>
                        <td className="px-4 py-3">{p.user?.name || p.user?.phone || '-'}</td>
                        <td className="px-4 py-3 font-medium">₹{Number(p.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-gray-500">₹{Number(p.gst_amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{p.payment_gateway || '-'}</td>
                        <td className="px-4 py-3">{statusBadge(p.status)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {p.status === 'COMPLETED' && (
                            <button
                              onClick={() => {
                                if (confirm(`Refund ₹${p.amount} for invoice ${p.invoice_number}?`)) {
                                  refundMutation.mutate({ paymentId: p.id, amount: p.amount });
                                }
                              }}
                              className="text-red-600 text-xs font-medium hover:underline"
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {meta.totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Page {page} of {meta.totalPages} ({meta.total} total)
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
                  <button onClick={() => setPage((p) => p + 1)} disabled={page >= meta.totalPages}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── EXPENSES TAB ── */}
      {activeTab === 'expenses' && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Expenses" value={`₹${totalExpenses.toLocaleString('en-IN')}`} color="red" />
            {summary.slice(0, 3).map((s: any) => (
              <StatCard
                key={s.category}
                title={CATEGORY_LABELS[s.category] || s.category}
                value={`₹${Number(s.total || 0).toLocaleString('en-IN')}`}
                color="yellow"
              />
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-autozy-charcoal">Expenses</h3>
                <select
                  value={expenseCategory}
                  onChange={(e) => { setExpenseCategory(e.target.value); setExpensePage(1); }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-autozy-blue"
                >
                  <option value="">All Categories</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <ExportButton
                  onClick={async () => {
                    try {
                      await exportAllPages(
                        (p, l) => expensesApi.getAll({
                          page: p, limit: l,
                          category: expenseCategory || undefined,
                        }),
                        [
                          { key: 'category', header: 'Category', transform: (v) => CATEGORY_LABELS[v] || v },
                          { key: 'amount', header: 'Amount', transform: (v) => Number(v || 0) },
                          { key: 'description', header: 'Description' },
                          { key: 'vendor_name', header: 'Vendor' },
                          { key: 'expense_date', header: 'Date', transform: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '-' },
                          { key: 'creator.name', header: 'Created By', transform: (v, r) => v || r.creator?.name || '-' },
                        ],
                        'expenses',
                      );
                    } catch (e: any) { alert(e.message); }
                  }}
                  disabled={expLoading || expensesList.length === 0}
                />
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="px-4 py-2 bg-autozy-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  + Add Expense
                </button>
              </div>
            </div>

            {/* Add Expense Form */}
            {showExpenseForm && (
              <div className="p-4 border-b bg-blue-50">
                <h4 className="font-medium text-sm text-autozy-charcoal mb-3">New Expense</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Category *</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-autozy-blue"
                    >
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-autozy-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date *</label>
                    <input
                      type="date"
                      value={expenseForm.expenseDate}
                      onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-autozy-blue"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Description *</label>
                    <input
                      type="text"
                      placeholder="Brief description of the expense"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-autozy-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Vendor Name</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={expenseForm.vendorName}
                      onChange={(e) => setExpenseForm({ ...expenseForm, vendorName: e.target.value })}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-autozy-blue"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      if (!expenseForm.amount || !expenseForm.description) return;
                      createExpenseMutation.mutate({
                        category: expenseForm.category,
                        amount: parseFloat(expenseForm.amount),
                        description: expenseForm.description,
                        vendorName: expenseForm.vendorName || undefined,
                        expenseDate: expenseForm.expenseDate,
                      });
                    }}
                    disabled={createExpenseMutation.isPending}
                    className="px-4 py-2 bg-autozy-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {createExpenseMutation.isPending ? 'Saving…' : 'Save Expense'}
                  </button>
                  <button
                    onClick={() => setShowExpenseForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {expLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : expensesList.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No expenses recorded</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Amount</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Vendor</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Created By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {expensesList.map((e: any) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                            {CATEGORY_LABELS[e.category] || e.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">₹{Number(e.amount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{e.description}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{e.vendor_name || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {e.expense_date ? new Date(e.expense_date).toLocaleDateString('en-IN') : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{e.creator?.name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {expMeta.totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Page {expensePage} of {expMeta.totalPages} ({expMeta.total} total)
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setExpensePage((p) => Math.max(1, p - 1))} disabled={expensePage <= 1}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
                  <button onClick={() => setExpensePage((p) => p + 1)} disabled={expensePage >= expMeta.totalPages}
                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
