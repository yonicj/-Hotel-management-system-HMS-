export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export function getSkip(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * limit;
}

export function parsePaginationParams(
  rawPage: unknown,
  rawLimit: unknown,
  maxLimit: number = 100
): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(rawPage ?? 1), 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(String(rawLimit ?? 20), 10) || 20)
  );
  return { page, limit };
}
