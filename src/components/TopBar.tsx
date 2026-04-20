'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/lib/store';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/areas': 'Areas & Cities',
  '/dashboard/staff': 'Workforce',
  '/dashboard/roles': 'Roles & Permissions',
  '/dashboard/subscriptions': 'Subscriptions',
  '/dashboard/inspections': 'Inspections',
  '/dashboard/services': 'Daily Services',
  '/dashboard/pricing': 'Pricing',
  '/dashboard/tickets': 'Support Tickets',
  '/dashboard/payments': 'Finance',
  '/dashboard/addons': 'Add-Ons',
  '/dashboard/customers': 'Customers',
  '/dashboard/reports': 'Reports',
  '/dashboard/settings': 'Settings',
};

function titleFor(path: string): string {
  if (TITLES[path]) return TITLES[path];
  // Try parent
  const parts = path.split('/').filter(Boolean);
  while (parts.length > 1) {
    parts.pop();
    const parent = '/' + parts.join('/');
    if (TITLES[parent]) return TITLES[parent];
  }
  return 'Admin';
}

function breadcrumbs(path: string) {
  const parts = path.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let acc = '';
  for (const p of parts) {
    acc += '/' + p;
    crumbs.push({
      label: TITLES[acc] || p.charAt(0).toUpperCase() + p.slice(1),
      href: acc,
    });
  }
  return crumbs;
}

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const staff = useAuthStore((s) => s.staff);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const crumbs = breadcrumbs(pathname);
  const initials = (staff?.name || '??')
    .split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-surface-border">
      <div className="flex items-center gap-4 h-16 px-4 lg:px-8 pl-16 lg:pl-8">
        {/* Title + breadcrumb */}
        <div className="flex-1 min-w-0">
          {crumbs.length > 1 && (
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-0.5">
              {crumbs.map((c, i) => (
                <span key={c.href} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-gray-300">/</span>}
                  {i < crumbs.length - 1 ? (
                    <Link href={c.href} className="hover:text-autozy-charcoal transition-colors">{c.label}</Link>
                  ) : (
                    <span className="text-gray-500 font-medium">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-base lg:text-lg font-semibold text-autozy-charcoal truncate">
            {titleFor(pathname)}
          </h1>
        </div>

        {/* Search (desktop only) */}
        <div className="hidden xl:flex items-center w-72 px-3 py-1.5 bg-surface-muted border border-surface-border rounded-lg text-sm text-gray-400 cursor-not-allowed">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-1.35z" />
          </svg>
          <span className="flex-1">Search…</span>
          <kbd className="text-2xs bg-white border border-surface-border rounded px-1.5 py-0.5 text-gray-500 font-mono">⌘K</kbd>
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-surface-muted hover:text-autozy-charcoal transition-colors" aria-label="Notifications">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={clsx(
              'flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg transition-colors',
              menuOpen ? 'bg-surface-muted' : 'hover:bg-surface-muted',
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-autozy-yellow to-autozy-yellow-dark text-autozy-dark font-bold flex items-center justify-center text-xs">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-autozy-charcoal leading-tight">{staff?.name}</p>
              <p className="text-2xs text-gray-500 leading-tight">{staff?.role?.replace('_', ' ')}</p>
            </div>
            <svg className="w-4 h-4 text-gray-400 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-surface-border rounded-xl shadow-pop py-1.5 animate-slide-up z-50">
              <div className="px-3 py-2 border-b border-surface-border">
                <p className="text-sm font-semibold text-autozy-charcoal truncate">{staff?.name}</p>
                <p className="text-xs text-gray-500 truncate">{staff?.phone}</p>
              </div>
              <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-surface-muted">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
