/**
 * Calculate the number of nights between two dates.
 */
export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a date to YYYY-MM-DD string.
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get today's date as a YYYY-MM-DD string.
 */
export function today(): string {
  return toDateString(new Date());
}

/**
 * Check if a date falls within a range (inclusive).
 */
export function isDateInRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

/**
 * Format a date to a human-readable string.
 * e.g. "Mon, 07 Oct 2026"
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
 * Format a datetime to a readable string including time.
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
