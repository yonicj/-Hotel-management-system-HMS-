import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { guestsService } from '../../services/guests.service';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { RESERVATION_STATUS_COLORS } from '../../lib/constants';
import { formatDisplayDate } from '@hms/shared-utils';

export default function GuestProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: guest, isLoading } = useQuery({
    queryKey: ['guest', id],
    queryFn: () => guestsService.getById(id!),
    enabled: !!id,
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ['guest-reservations', id],
    queryFn: () => guestsService.getReservations(id!),
    enabled: !!id,
  });

  if (isLoading) return <p className="p-6 text-gray-400">Loading...</p>;
  if (!guest) return <p className="p-6 text-red-500">Guest not found</p>;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`${guest.firstName} ${guest.lastName}`}
        subtitle={`Guest profile`}
        actions={<Button variant="secondary" onClick={() => navigate(`/guests/${id}/edit`)}>Edit</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Contact</h3>
          <p className="text-sm">{guest.email}</p>
          <p className="text-sm">{guest.phone}</p>
          <p className="text-sm">{guest.nationality}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">ID</h3>
          <p className="text-sm capitalize">{guest.idType?.replace('_', ' ') ?? '—'}</p>
          <p className="text-sm font-mono">{guest.idNumber ?? '—'}</p>
          <p className="mt-2"><Badge label={`VIP: ${guest.vipLevel}`} className="bg-purple-100 text-purple-800" /></p>
        </div>
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-3">Reservation History</h3>
      <Table
        keyField="id"
        data={reservations}
        emptyMessage="No past reservations"
        columns={[
          { header: 'Confirmation', render: (r: any) => <span className="font-mono text-sm">{r.confirmationNumber}</span> },
          { header: 'Room', render: (r: any) => r.room?.roomNumber ?? '—' },
          { header: 'Check-in', render: (r: any) => formatDisplayDate(r.checkInDate) },
          { header: 'Check-out', render: (r: any) => formatDisplayDate(r.checkOutDate) },
          { header: 'Status', render: (r: any) => <Badge label={r.status} className={RESERVATION_STATUS_COLORS[r.status.toLowerCase()] ?? ''} /> },
        ]}
      />
    </div>
  );
}
