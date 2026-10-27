export const ROOM_STATUSES = {
  AVAILABLE: { code: 'AVAILABLE', label: 'Available', color: '#10B981' },
  OCCUPIED: { code: 'OCCUPIED', label: 'Occupied', color: '#3B82F6' },
  RESERVED: { code: 'RESERVED', label: 'Reserved', color: '#F59E0B' },
  DIRTY: { code: 'DIRTY', label: 'Dirty', color: '#EF4444' },
  CLEANING: { code: 'CLEANING', label: 'Cleaning', color: '#8B5CF6' },
  MAINTENANCE: { code: 'MAINTENANCE', label: 'Maintenance', color: '#6B7280' },
  OUT_OF_ORDER: { code: 'OUT_OF_ORDER', label: 'Out of Order', color: '#1F2937' },
} as const;
