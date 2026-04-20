'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configApi } from '@/lib/api';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ key: '', value: '', description: '' });
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => configApi.getAll(),
  });

  const configs = data?.data?.data || data?.data || [];
  const configList = Array.isArray(configs) ? configs : [];

  const saveMutation = useMutation({
    mutationFn: (data: { key: string; value: string; description: string }) =>
      configApi.set(data.key, data.value, data.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      setShowForm(false);
      setForm({ key: '', value: '', description: '' });
      setEditingKey(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => configApi.delete(key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-config'] }),
  });

  const handleSaveEdit = (key: string) => {
    saveMutation.mutate({ key, value: editValue, description: '' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">System configuration & parameters</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg font-medium text-sm hover:bg-yellow-400 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Config'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold mb-4">Add System Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              placeholder="Config key (e.g. max_daily_cars)"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              className="px-4 py-2 border rounded-lg text-sm"
            />
            <input
              placeholder="Value"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="px-4 py-2 border rounded-lg text-sm"
            />
            <div className="flex gap-2">
              <input
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
              />
              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={!form.key || !form.value || saveMutation.isPending}
                className="px-4 py-2 bg-autozy-yellow text-autozy-dark rounded-lg text-sm font-medium disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-autozy-charcoal">System Parameters</h3>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : configList.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No system configurations found. Add one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Key</th>
                  <th className="px-4 py-3 text-left">Value</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {configList.map((cfg: any) => (
                  <tr key={cfg.key || cfg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{cfg.key}</td>
                    <td className="px-4 py-3">
                      {editingKey === cfg.key ? (
                        <div className="flex gap-2">
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="px-2 py-1 border rounded text-sm w-32"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(cfg.key)}
                            className="text-green-600 text-xs font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="text-gray-400 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {JSON.stringify(cfg.value)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[250px] truncate">
                      {cfg.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {cfg.updated_at ? new Date(cfg.updated_at).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingKey(cfg.key); setEditValue(JSON.stringify(cfg.value)); }}
                          className="text-blue-600 text-xs font-medium hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete config "${cfg.key}"?`)) {
                              deleteMutation.mutate(cfg.key);
                            }
                          }}
                          className="text-red-600 text-xs font-medium hover:underline"
                        >
                          Delete
                        </button>
                      </div>
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
