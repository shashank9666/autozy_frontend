// ============================================================
// AUTOZY Admin Panel - API Response Types
// ============================================================

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export type PaginatedResponse<T> = ApiResponse<T[]>;
