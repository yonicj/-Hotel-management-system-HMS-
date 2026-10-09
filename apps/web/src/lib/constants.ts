export const APP_NAME = 'HMS';
export const APP_FULL_NAME = 'Hotel Management System';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Query cache keys
export const QUERY_KEYS = {
  ME: ['me'],
  ROOMS: ['rooms'],
  ROOM_TYPES: ['room-types'],
  RATE_PLANS: ['rate-plans'],
  GUESTS: ['guests'],
  RESERVATIONS: ['reservations'],
  ARRIVALS: ['arrivals'],
  DEPARTURES: ['departures'],
  IN_HOUSE: ['in-house'],
  ROOM_RACK: ['room-rack'],
  HOUSEKEEPING_TASKS: ['housekeeping-tasks'],
  HOUSEKEEPING_BOARD: ['housekeeping-board'],
  FOLIO: (id: string) => ['folio', id],
  REPORTS_OCCUPANCY: ['reports', 'occupancy'],
  REPORTS_REVENUE: ['reports', 'revenue'],
  NIGHT_AUDIT: ['night-audit'],
  USERS: ['users'],
} as const;

// Room status color map
export const ROOM_STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  occupied: 'bg-blue-100 text-blue-800',
  dirty: 'bg-yellow-100 text-yellow-800',
  clean: 'bg-emerald-100 text-emerald-800',
  maintenance: 'bg-orange-100 text-orange-800',
  out_of_order: 'bg-red-100 text-red-800',
};

// Reservation status color map
export const RESERVATION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  checked_in: 'bg-green-100 text-green-800',
  checked_out: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-red-100 text-red-700',
};
