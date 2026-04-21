/**
 * Frontend RBAC. Source of truth for which roles can access which routes
 * and which sidebar items are visible. Backend enforces the actual policy
 * via @Roles() decorators — this is purely UX shaping.
 */

export type StaffRole =
  | 'ADMIN'
  | 'CITY_MANAGER'
  | 'SUPERVISOR'
  | 'DETAILER'
  | 'INSPECTOR'
  | 'SPECIALIST';

/** Module keys that match the dashboard route segments. */
export type ModuleKey =
  | 'dashboard'
  | 'areas'
  | 'staff'
  | 'roles'
  | 'subscriptions'
  | 'inspections'
  | 'services'
  | 'pricing'
  | 'tickets'
  | 'payments'
  | 'addons'
  | 'customers'
  | 'reports'
  | 'settings'
  | 'notifications';

/** What each role is allowed to access. '*' means everything. */
export const ROLE_PERMISSIONS: Record<StaffRole, ModuleKey[] | '*'> = {
  ADMIN: '*',
  CITY_MANAGER: [
    'dashboard', 'areas', 'staff', 'subscriptions', 'inspections',
    'services', 'tickets', 'payments', 'addons', 'customers', 'reports',
    'notifications',
  ],
  SUPERVISOR: ['dashboard', 'staff', 'services', 'inspections', 'tickets', 'reports', 'notifications'],
  DETAILER: ['dashboard', 'services'],
  INSPECTOR: ['dashboard', 'inspections'],
  SPECIALIST: ['dashboard', 'addons', 'services'],
};

export function canAccess(role: string | undefined | null, module: ModuleKey): boolean {
  if (!role) return false;
  const allowed = ROLE_PERMISSIONS[role as StaffRole];
  if (!allowed) return false;
  if (allowed === '*') return true;
  return allowed.includes(module);
}

/** Map a pathname like /dashboard/staff to its module key. */
export function moduleFromPath(pathname: string): ModuleKey | null {
  if (!pathname.startsWith('/dashboard')) return null;
  const seg = pathname.split('/')[2];
  if (!seg) return 'dashboard';
  // strip dynamic params
  return (seg.split('?')[0] as ModuleKey) || 'dashboard';
}

/** Default landing page for each role (the first module they can see). */
export function defaultRouteFor(role: string | undefined): string {
  if (!role) return '/dashboard';
  const allowed = ROLE_PERMISSIONS[role as StaffRole];
  if (!allowed || allowed === '*') return '/dashboard';
  const first = allowed[0];
  return first === 'dashboard' ? '/dashboard' : `/dashboard/${first}`;
}

/**
 * Demo accounts. Phones match the seed data in
 * backend/src/database/seeds/seed.ts
 */
export interface DemoAccount {
  role: StaffRole;
  label: string;
  phone: string;
  city?: string;
  description: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'ADMIN',
    label: 'System Admin',
    phone: '9999999999',
    description: 'Full access — all modules, all cities, financial data, system config.',
  },
  {
    role: 'CITY_MANAGER',
    label: 'City Manager (Mumbai)',
    phone: '8800300003',
    city: 'Mumbai',
    description: 'Manages Mumbai operations — staff, services, expenses, tickets, customers.',
  },
  {
    role: 'SUPERVISOR',
    label: 'Field Supervisor',
    phone: '8800100005',
    city: 'Hyderabad',
    description: 'Oversees Hyderabad detailers — services, inspections, attendance, tickets.',
  },
  {
    role: 'DETAILER',
    label: 'Detailer',
    phone: '8800100001',
    city: 'Hyderabad',
    description: 'Field staff — daily service assignments and attendance.',
  },
  {
    role: 'INSPECTOR',
    label: 'Inspector',
    phone: '8800100003',
    city: 'Hyderabad',
    description: 'Vehicle inspections for new subscriptions and quality checks.',
  },
  {
    role: 'SPECIALIST',
    label: 'Specialist',
    phone: '8800100004',
    city: 'Hyderabad',
    description: 'Premium add-on services (foam wash, interior, PPF).',
  },
];
