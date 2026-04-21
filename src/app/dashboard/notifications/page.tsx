'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import Badge from '@/components/Badge';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll({ limit: 50 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.data?.items || data?.data || [];
  const notifList = Array.isArray(notifications) ? notifications : [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SERVICE_UPDATE': return 'success';
      case 'INSPECTION': return 'warning';
      case 'PAYMENT': return 'info';
      case 'TICKET': return 'danger';
      case 'SYSTEM': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-autozy-charcoal">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">System alerts and activity logs</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifList.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No notifications yet.
          </div>
        ) : (
          <div className="divide-y">
            {notifList.map((notif: any) => (
              <div 
                key={notif.id} 
                className={`p-4 hover:bg-gray-50 transition-colors flex gap-4 ${!notif.is_read ? 'bg-yellow-50/30' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notif.is_read ? 'bg-autozy-yellow/20 text-autozy-dark' : 'bg-gray-100 text-gray-400'}`}>
                  {!notif.is_read ? (
                    <span className="w-2 h-2 bg-autozy-yellow rounded-full animate-pulse" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-semibold ${!notif.is_read ? 'text-autozy-charcoal' : 'text-gray-600'}`}>
                        {notif.title}
                      </h4>
                      <Badge variant={getTypeColor(notif.type)} className="text-[10px] uppercase px-1.5 py-0">
                        {notif.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {format(new Date(notif.created_at), 'MMM dd, hh:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {notif.body}
                  </p>
                  {!notif.is_read && (
                    <button
                      onClick={() => markReadMutation.mutate(notif.id)}
                      disabled={markReadMutation.isPending}
                      className="text-xs font-medium text-autozy-charcoal hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
