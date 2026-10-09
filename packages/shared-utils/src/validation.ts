/**
 * Validate an email address format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate a phone number (basic international format).
 */
export function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{6,14}$/.test(phone.replace(/\s/g, ''));
}

/**
 * Check that check-out date is after check-in date.
 */
export function isValidDateRange(checkIn: string, checkOut: string): boolean {
  return new Date(checkOut) > new Date(checkIn);
}

/**
 * Check that a date is not in the past (relative to today).
 */
export function isNotPastDate(date: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) >= today;
}
