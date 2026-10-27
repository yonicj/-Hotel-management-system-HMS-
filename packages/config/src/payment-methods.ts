export const PAYMENT_METHODS = {
  CASH: { id: 'CASH', name: 'Cash (ብር/USD)' },
  TELEBIRR: { id: 'TELEBIRR', name: 'Telebirr SuperApp' },
  CHAPA: { id: 'CHAPA', name: 'Chapa Gateway' },
  CREDIT_CARD: { id: 'CREDIT_CARD', name: 'Visa / MasterCard' },
  BANK_TRANSFER: { id: 'BANK_TRANSFER', name: 'CBE / Awash / Dashen Bank Transfer' },
  CITY_LEDGER: { id: 'CITY_LEDGER', name: 'Corporate Direct Billing' },
} as const;
