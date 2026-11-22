import * as React from 'react';

export type RoomStatusType =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'OCCUPIED'
  | 'CLEANING'
  | 'DIRTY'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export type ReservationStatusType =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type FolioStatusType = 'OPEN' | 'CLOSED' | 'SETTLED';

export type StatusValue =
  | RoomStatusType
  | ReservationStatusType
  | FolioStatusType
  | string;

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusValue;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  // ─── 7 Canonical SRS Room Statuses ──────────────────────────────────────────
  AVAILABLE: {
    label: 'Available',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  RESERVED: {
    label: 'Reserved',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  OCCUPIED: {
    label: 'Occupied',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  CLEANING: {
    label: 'Cleaning',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  DIRTY: {
    label: 'Dirty',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  OUT_OF_SERVICE: {
    label: 'Out of Service',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
  },

  // ─── Reservation Statuses ──────────────────────────────────────────────────
  PENDING: {
    label: 'Pending',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    dot: 'bg-yellow-500',
  },
  CONFIRMED: {
    label: 'Confirmed',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  CHECKED_IN: {
    label: 'Checked In',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  NO_SHOW: {
    label: 'No Show',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },

  // ─── Folio Statuses ────────────────────────────────────────────────────────
  OPEN: {
    label: 'Open',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  CLOSED: {
    label: 'Closed',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
  },
  SETTLED: {
    label: 'Settled',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  label: 'Unknown',
  bg: 'bg-gray-100',
  text: 'text-gray-700',
  border: 'border-gray-200',
  dot: 'bg-gray-400',
};

const SIZE_STYLES = {
  sm: 'text-xs px-2 py-0.5 gap-1.5',
  md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
};

const DOT_SIZES = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  size = 'md',
  showDot = true,
  className = '',
  ...props
}) => {
  const normalizedKey = String(status || '').toUpperCase();
  const config = STATUS_CONFIGS[normalizedKey] || {
    ...DEFAULT_CONFIG,
    label: status ? String(status) : 'Unknown',
  };

  const displayLabel = label ?? config.label;

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm transition-colors ${config.bg} ${config.text} ${config.border} ${SIZE_STYLES[size]} ${className}`}
      {...props}
    >
      {showDot && (
        <span
          className={`rounded-full shrink-0 ${config.dot} ${DOT_SIZES[size]}`}
          aria-hidden="true"
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
};
