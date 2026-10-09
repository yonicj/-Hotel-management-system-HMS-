export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Build pagination metadata.
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Calculate the skip (offset) value for database queries.
 */
export function getSkip(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * limit;
}

/**
 * Parse and clamp pagination query params.
 */
export function parsePaginationParams(
  rawPage: unknown,
  rawLimit: unknown,
  maxLimit: number = 100
): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(rawPage ?? 1), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(rawLimit ?? 20), 10) || 20));
  return { page, limit };
}
