'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { canAccess, ModuleKey } from '@/lib/permissions';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  module: ModuleKey;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard',                module: 'dashboard',     label: 'Dashboard',      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { href: '/dashboard/reports',        module: 'reports',       label: 'Reports',        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { href: '/dashboard/services',       module: 'services',      label: 'Daily Services', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { href: '/dashboard/inspections',    module: 'inspections',   label: 'Inspections',    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      { href: '/dashboard/addons',         module: 'addons',        label: 'Add-Ons',        icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
      { href: '/dashboard/tickets',        module: 'tickets',       label: 'Support',        icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { href: '/dashboard/customers',      module: 'customers',     label: 'Customers',      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { href: '/dashboard/subscriptions',  module: 'subscriptions', label: 'Subscriptions',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { href: '/dashboard/payments',       module: 'payments',      label: 'Finance',        icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    ],
  },
  {
    title: 'Workforce',
    items: [
      { href: '/dashboard/staff',          module: 'staff',         label: 'Staff',          icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { href: '/dashboard/roles',          module: 'roles',         label: 'Roles',          icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { href: '/dashboard/areas',          module: 'areas',         label: 'Areas & Cities', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { href: '/dashboard/pricing',        module: 'pricing',       label: 'Pricing',        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { href: '/dashboard/settings',       module: 'settings',      label: 'Settings',       icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ],
  },
];

const ROLE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  ADMIN:        { bg: 'bg-purple-500/15',  text: 'text-purple-300', label: 'Admin' },
  CITY_MANAGER: { bg: 'bg-blue-500/15',    text: 'text-blue-300',   label: 'City Manager' },
  SUPERVISOR:   { bg: 'bg-emerald-500/15', text: 'text-emerald-300',label: 'Supervisor' },
  DETAILER:     { bg: 'bg-amber-500/15',   text: 'text-amber-300',  label: 'Detailer' },
  INSPECTOR:    { bg: 'bg-orange-500/15',  text: 'text-orange-300', label: 'Inspector' },
  SPECIALIST:   { bg: 'bg-teal-500/15',    text: 'text-teal-300',   label: 'Specialist' },
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const staff = useAuthStore((s) => s.staff);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const role = staff?.role;
  const roleMeta = ROLE_BADGE[role || ''] || { bg: 'bg-gray-500/15', text: 'text-gray-300', label: role || '' };
  const initials = (staff?.name || '??')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Filter nav: drop items, then drop empty sections
  const visibleSections = NAV_SECTIONS
    .map((sec) => ({ ...sec, items: sec.items.filter((i) => canAccess(role, i.module)) }))
    .filter((sec) => sec.items.length > 0);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  const navContent = (
    <>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-nav-border/60">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-autozy-yellow to-autozy-yellow-dark flex items-center justify-center shadow-glow-yellow group-hover:scale-105 transition-transform">
            <span className="text-autozy-dark font-extrabold text-base">A</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight leading-none">AUTOZY</h1>
            <p className="text-[10px] text-nav-text-muted mt-0.5 tracking-widest uppercase">Admin</p>
          </div>
        </Link>
      </div>

      {/* User card */}
      {staff && (
        <div className="mx-3 mt-3 px-3 py-2.5 bg-nav-surface/80 border border-nav-border/60 rounded-xl flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-autozy-yellow to-autozy-yellow-dark text-autozy-dark font-bold flex items-center justify-center flex-shrink-0 text-sm">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-nav-bg" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">{staff.name}</p>
            <span className={clsx(
              'inline-flex items-center px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-semibold',
              roleMeta.bg, roleMeta.text,
            )}>
              {roleMeta.label}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 mt-4 overflow-y-auto scrollbar-dark pb-4">
        {visibleSections.map((sec) => (
          <div key={sec.title} className="mb-5">
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-nav-text-muted">
              {sec.title}
            </p>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      'group relative flex items-center gap-3 pl-3 pr-3 py-2 rounded-lg text-sm font-medium transition-all',
                      active
                        ? 'bg-autozy-yellow/10 text-autozy-yellow'
                        : 'text-nav-text hover:bg-nav-hover hover:text-white',
                    )}
                  >
                    {/* Active indicator bar */}
                    <span
                      className={clsx(
                        'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-r transition-all',
                        active ? 'h-5 bg-autozy-yellow' : 'h-0 bg-transparent',
                      )}
                    />
                    <svg
                      className={clsx('w-[18px] h-[18px] flex-shrink-0', active ? 'text-autozy-yellow' : 'text-nav-text-muted group-hover:text-white')}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-nav-border/60">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-nav-text hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
        <p className="text-[10px] text-nav-text-muted mt-2 px-3 leading-relaxed">
          v1.0 · Daily car care.<br />Done right.
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 flex items-center justify-center bg-white border border-surface-border rounded-lg shadow-soft text-autozy-charcoal"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)}>
          <aside
            className="w-72 bg-nav-bg min-h-screen flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-nav-bg min-h-screen flex-col border-r border-nav-border/60 sticky top-0 max-h-screen">
        {navContent}
      </aside>
    </>
  );
}
