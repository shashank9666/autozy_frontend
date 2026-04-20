'use client';

import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/lib/api';

const ROLES = [
  {
    role: 'ADMIN',
    label: 'Admin',
    color: 'purple',
    description: 'Full system access — manage staff, subscriptions, pricing, config, and reports.',
    permissions: ['All Modules', 'User Management', 'Financial Data', 'System Config', 'Reports'],
  },
  {
    role: 'CITY_MANAGER',
    label: 'City Manager',
    color: 'blue',
    description: 'Manages operations for a specific city — staff, services, tickets, and area management.',
    permissions: ['Staff Management', 'Service Records', 'Tickets', 'Area Management', 'City Reports'],
  },
  {
    role: 'SUPERVISOR',
    label: 'Supervisor',
    color: 'green',
    description: 'Oversees detailers in an area — attendance, daily services, and performance.',
    permissions: ['Staff View', 'Service Records', 'Attendance', 'Performance Reports'],
  },
  {
    role: 'DETAILER',
    label: 'Detailer',
    color: 'yellow',
    description: 'Field staff who perform vehicle cleaning services on a daily basis.',
    permissions: ['Mark Attendance', 'View Assignments', 'Update Service Status'],
  },
  {
    role: 'INSPECTOR',
    label: 'Inspector',
    color: 'orange',
    description: 'Conducts vehicle inspections for new subscriptions and quality checks.',
    permissions: ['View Inspections', 'Update Inspection Status', 'Upload Photos'],
  },
  {
    role: 'SPECIALIST',
    label: 'Specialist',
    color: 'teal',
    description: 'Performs premium add-on services like foam wash, interior cleaning, and PPF.',
    permissions: ['View Add-on Bookings', 'Update Service Status', 'Mark Attendance'],
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; badge: string }> = {
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700'   },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700'  },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700'},
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700'},
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-700',   badge: 'bg-teal-100 text-teal-700'   },
  gray:   { bg: 'bg-gray-50',   text: 'text-gray-700',   badge: 'bg-gray-100 text-gray-700'   },
};

export default function RolesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['roles-summary'],
    queryFn: () => staffApi.getRolesSummary(),
  });

  const summary: { role: string; count: number }[] = data?.data?.data || [];
  const countMap = Object.fromEntries(summary.map((s) => [s.role, s.count]));
  const totalStaff = summary.reduce((sum, s) => sum + s.count, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-autozy-charcoal">Roles & Permissions</h1>
        <p className="text-sm text-gray-500 mt-1">Staff roles, access levels and team composition</p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Active Staff</p>
          <p className="text-3xl font-bold text-autozy-charcoal mt-1">
            {isLoading ? '—' : totalStaff}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Roles Defined</p>
          <p className="text-3xl font-bold text-autozy-charcoal mt-1">{ROLES.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Admins</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">
            {isLoading ? '—' : countMap['ADMIN'] || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Field Staff</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {isLoading ? '—' : (countMap['DETAILER'] || 0) + (countMap['SPECIALIST'] || 0) + (countMap['INSPECTOR'] || 0)}
          </p>
        </div>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {ROLES.map((r) => {
          const c = COLOR_MAP[r.color] || COLOR_MAP.gray;
          const count = isLoading ? null : (countMap[r.role] ?? 0);
          return (
            <div key={r.role} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className={`${c.bg} px-5 py-4 flex items-center justify-between`}>
                <div>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${c.text}`}>{r.label}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{r.role}</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${c.text}`}>
                    {count === null ? '—' : count}
                  </span>
                  <p className="text-xs text-gray-500">active</p>
                </div>
              </div>

              <div className="px-5 py-4">
                <p className="text-sm text-gray-600 mb-3">{r.description}</p>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Access</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.permissions.map((perm) => (
                      <span key={perm} className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.badge}`}>
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end">
                <a
                  href={`/dashboard/staff?role=${r.role}`}
                  className={`text-xs font-medium ${c.text} hover:underline`}
                >
                  View {r.label} Staff →
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
