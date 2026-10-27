export function formatGregorianDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
