/**
 * Generate a human-readable confirmation number.
 * Format: HMS-YYYYMMDD-XXXXX (e.g. HMS-20261007-A3F9K)
 */
export function generateConfirmationNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `HMS-${datePart}-${randomPart}`;
}

/**
 * Generate a folio number.
 * Format: FOL-XXXXXXXX
 */
export function generateFolioNumber(): string {
  const randomPart = Math.random().toString(36).toUpperCase().slice(2, 10);
  return `FOL-${randomPart}`;
}

/**
 * Generate a simple random reference number for payments.
 */
export function generatePaymentReference(): string {
  return `PAY-${Date.now()}-${Math.random().toString(36).toUpperCase().slice(2, 6)}`;
}
