import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useReservations, useCancelReservation } from '../../hooks/useReservations';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/shared/PageHeader';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { RESERVATION_STATUS_COLORS } from '../../lib/constants';
import { formatDisplayDate } from '@hms/shared-utils';
import type { Reservation } from '@hms/shared-types';

export default function ReservationList() {
  const navigate = useNavigate();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const { data, isLoading } = useReservations();
  const cancel = useCancelReservation();

  const reservations: Reservation[] = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Reservations"
        subtitle={`${data?.pagination?.total ?? 0} total reservations`}
        actions={
          <Button onClick={() => navigate('/reservations/new')}>
            <Plus className="w-4 h-4" /> New Reservation
          </Button>
        }
      />

      <Table
        keyField="id"
        loading={isLoading}
        data={reservations}
        columns={[
          { header: 'Confirmation', render: (r) => <span className="font-mono text-sm">{r.confirmationNumber}</span> },
          { header: 'Guest', render: (r) => (r as any).reservationGuests?.[0]?.guest
            ? `${(r as any).reservationGuests[0].guest.firstName} ${(r as any).reservationGuests[0].guest.lastName}`
            : '—'
          },
          { header: 'Room', render: (r) => r.room?.roomNumber ?? <span className="text-gray-400">Unassigned</span> },
          { header: 'Check-in', render: (r) => formatDisplayDate(r.checkInDate) },
          { header: 'Check-out', render: (r) => formatDisplayDate(r.checkOutDate) },
          { header: 'Status', render: (r) => (
            <Badge label={r.status.replace('_', ' ')} className={RESERVATION_STATUS_COLORS[r.status.toLowerCase()] ?? ''} />
          )},
          { header: 'Actions', render: (r) => (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate(`/reservations/${r.id}`)}>View</Button>
              {!['checked_out', 'cancelled'].includes(r.status.toLowerCase()) && (
                <Button size="sm" variant="danger" onClick={() => setCancelId(r.id)}>Cancel</Button>
              )}
            </div>
          )},
        ]}
      />

      <ConfirmDialog
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => { if (cancelId) cancel.mutate(cancelId, { onSettled: () => setCancelId(null) }); }}
        title="Cancel Reservation"
        message="Are you sure you want to cancel this reservation? This action cannot be undone."
        confirmLabel="Cancel Reservation"
        loading={cancel.isPending}
      />
    </div>
  );
}
