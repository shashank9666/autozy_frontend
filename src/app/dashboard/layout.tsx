'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';
import { canAccess, defaultRouteFor, moduleFromPath } from '@/lib/permissions';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const staff = useAuthStore((s) => s.staff);
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setStaff = useAuthStore((s) => s.setStaff);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const logout = useAuthStore((s) => s.logout);

  // 1. Bootstrap: if we have a token but no staff, fetch /me
  useEffect(() => {
    if (!token) {
      router.replace('/');
      return;
    }
    if (staff) {
      setHydrated(true);
      return;
    }
    authApi.me()
      .then((res) => {
        const user = res.data?.data ?? res.data;
        if (user?.id) setStaff(user);
        else { logout(); router.replace('/'); }
      })
      .catch(() => { logout(); router.replace('/'); });
  }, [token, staff, router, setStaff, setHydrated, logout]);

  // 2. Route guard: redirect to default page if current route is forbidden
  useEffect(() => {
    if (!hydrated || !staff) return;
    const mod = moduleFromPath(pathname);
    if (mod && !canAccess(staff.role, mod)) {
      router.replace(defaultRouteFor(staff.role));
    }
  }, [pathname, staff, hydrated, router]);

  if (!hydrated || !staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <svg className="w-5 h-5 animate-spin text-autozy-yellow" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading workspace…
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 lg:p-8 overflow-auto animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
