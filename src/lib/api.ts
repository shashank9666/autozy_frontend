import axios from 'axios';
import { useAuthStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL && typeof window !== 'undefined') {
  console.warn('NEXT_PUBLIC_API_URL is not defined in environment variables');
}

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      useAuthStore.getState().logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  },
);

// Auth
export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/staff/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string, deviceId: string) =>
    api.post('/auth/staff/verify-otp', { phone, otp, deviceId }),
  me: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  getOperations: (cityId?: string) =>
    api.get('/admin/dashboard/operations', { params: { cityId } }),
};

// Cities & Areas
export const areasApi = {
  getCities: () => api.get('/admin/cities'),
  createCity: (data: any) => api.post('/admin/cities', data),
  getAreas: (params: any) => api.get('/admin/areas', { params }),
  createArea: (data: any) => api.post('/admin/areas', data),
  updateArea: (id: string, data: any) => api.patch(`/admin/areas/${id}`, data),
  pauseArea: (id: string) => api.post(`/admin/areas/${id}/pause`),
  resumeArea: (id: string) => api.post(`/admin/areas/${id}/resume`),
};

// Staff
export const staffApi = {
  getAll: (params: any) => api.get('/admin/staff', { params }),
  getById: (id: string) => api.get(`/admin/staff/${id}`),
  create: (data: any) => api.post('/admin/staff', data),
  update: (id: string, data: any) => api.patch(`/admin/staff/${id}`, data),
  getPerformance: (id: string, startDate: string, endDate: string) =>
    api.get(`/admin/staff/${id}/performance`, { params: { startDate, endDate } }),
  getRolesSummary: () => api.get('/admin/roles/summary'),
};

// Subscriptions
export const subscriptionsApi = {
  getAll: (params?: any) => api.get('/admin/subscriptions', { params }),
  getById: (id: string) => api.get(`/admin/subscriptions/${id}`),
  pause: (id: string) => api.post(`/admin/subscriptions/${id}/pause`),
  cancel: (id: string, reason?: string) => api.post(`/admin/subscriptions/${id}/cancel`, { reason }),
  activate: (id: string) => api.post(`/admin/subscriptions/${id}/activate`),
  getStats: () => api.get('/admin/subscriptions/stats'),
};

// Inspections
export const inspectionsApi = {
  getAll: (params?: any) => api.get('/admin/inspections', { params }),
  getById: (id: string) => api.get(`/admin/inspections/${id}`),
  create: (data: any) => api.post('/admin/inspections', data),
  update: (id: string, data: any) => api.patch(`/admin/inspections/${id}`, data),
};

// Daily Services
export const servicesApi = {
  getDailyStatus: (params?: any) => api.get('/admin/services/daily-status', { params }),
  getRecords: (params?: any) => api.get('/admin/services/records', { params }),
  createRecord: (data: any) => api.post('/admin/services/records', data),
  updateRecord: (id: string, data: any) => api.patch(`/admin/services/records/${id}`, data),
};

// System Config
export const configApi = {
  getAll: () => api.get('/admin/config'),
  set: (key: string, value: string, description?: string) =>
    api.post('/admin/config', { key, value, description: description || `Config: ${key}` }),
  delete: (key: string) => api.delete(`/admin/config/${key}`),
};

// Users / Customers
export const usersApi = {
  getAll: (params?: any) => api.get('/admin/customers', { params }),
  getById: (id: string) => api.get(`/admin/customers/${id}`),
};

// Tickets
export const ticketsApi = {
  getAll: (params: any) => api.get('/admin/tickets', { params }),
  resolve: (id: string, data: any) => api.post(`/admin/tickets/${id}/resolve`, data),
  reject: (id: string, notes: string) => api.post(`/admin/tickets/${id}/reject`, { notes }),
};

// Payments
export const paymentsApi = {
  getAll: (params: any) => api.get('/admin/payments', { params }),
  refund: (paymentId: string, amount: number, reason: string) =>
    api.post('/admin/payments/refund', { paymentId, amount, reason }),
};

// Expenses
export const expensesApi = {
  getAll: (params?: any) => api.get('/admin/expenses', { params }),
  create: (data: any) => api.post('/admin/expenses', data),
  getSummary: (params?: any) => api.get('/admin/expenses/summary', { params }),
};

// Plans
export const plansApi = {
  getAll: () => api.get('/plans'),
};

// Pricing
export const pricingApi = {
  getMatrix: (cityId: string) => api.get('/pricing', { params: { cityId } }),
  create: (data: any) => api.post('/admin/pricing', data),
};

// Add-ons
export const addonsApi = {
  getCatalog: (params?: any) => api.get('/admin/addons/services', { params }),
  getServices: (params?: any) => api.get('/admin/addons/services', { params }),
  createService: (data: any) => api.post('/admin/addons/services', data),
  getBookings: (params?: any) => api.get('/admin/addons/bookings', { params }),
  specialistKPIs: (id?: string) =>
    id ? api.get(`/admin/addons/specialist-kpis/${id}`) : api.get('/admin/addons/specialist-kpis'),
  getEquipment: (cityId: string) => api.get('/admin/equipment', { params: { cityId } }),
};

// Reports
export const reportsApi = {
  getRevenue: (params?: any) => api.get('/admin/reports/revenue', { params }),
  getSubscriptionGrowth: (params?: any) => api.get('/admin/reports/subscription-growth', { params }),
  getSlaCompliance: (params?: any) => api.get('/admin/reports/sla-compliance', { params }),
  getTopAreas: (params?: any) => api.get('/admin/reports/top-areas', { params }),
};

// Notifications
export const notificationsApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

export default api;
