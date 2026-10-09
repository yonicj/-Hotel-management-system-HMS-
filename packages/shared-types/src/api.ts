// ─── Generic API Response Wrappers ──────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Common Query Params ─────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  from: string;
  to: string;
}

export interface AvailabilityParams {
  checkIn: string;
  checkOut: string;
  roomTypeId?: string;
  adults?: number;
  children?: number;
}
