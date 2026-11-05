/**
 * Calculate number of nights between two date strings (YYYY-MM-DD).
 */
export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Get today's date as a YYYY-MM-DD string (UTC).
 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format a date for display: "Mon, 07 Oct 2026"
 */
export function formatDisplayDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a datetime for display including time.
 */
export function formatDisplayDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
