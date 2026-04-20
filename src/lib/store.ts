import { create } from 'zustand';

export interface AuthStaff {
  id: string;
  name: string;
  role: string;
  phone: string;
  city_id?: string | null;
  area_id?: string | null;
}

interface AuthState {
  staff: AuthStaff | null;
  token: string | null;
  hydrated: boolean;
  setAuth: (staff: AuthStaff, token: string) => void;
  setStaff: (staff: AuthStaff) => void;
  setHydrated: (v: boolean) => void;
  logout: () => void;
}

const readStaff = (): AuthStaff | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('admin_staff');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  staff: readStaff(),
  token: typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null,
  hydrated: false,
  setAuth: (staff, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_staff', JSON.stringify(staff));
      document.cookie = `admin_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }
    set({ staff, token, hydrated: true });
  },
  setStaff: (staff) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_staff', JSON.stringify(staff));
    }
    set({ staff, hydrated: true });
  },
  setHydrated: (v) => set({ hydrated: v }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_staff');
      document.cookie = 'admin_token=; path=/; max-age=0';
    }
    set({ staff: null, token: null, hydrated: true });
  },
}));
