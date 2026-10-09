import { useParams, useNavigate } from 'react-router-dom';
import { useReservation, useConfirmReservation } from '../../hooks/useReservations';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { RESERVATION_STATUS_COLORS } from '../../lib/constants';
import { formatDisplayDate, formatCurrency } from '@hms/shared-utils';

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: reservation, isLoading } = useReservation(id!);
  const confirm = useConfirmReservation();

  if (isLoading) return <p className="text-gray-400 p-6">Loading...</p>;
  if (!reservation) return <p className="text-red-500 p-6">Reservation not found</p>;

  const primaryGuest = (reservation as any).reservationGuests?.find((rg: any) => rg.isPrimary)?.guest;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`Reservation ${reservation.confirmationNumber}`}
        actions={
          <div className="flex gap-2">
            {reservation.status === 'PENDING' && (
              <Button onClick={() => confirm.mutate(reservation.id)} loading={confirm.isPending}>
                Confirm
              </Button>
            )}
            {reservation.status === 'CONFIRMED' && (
              <Button onClick={() => navigate(`/front-desk/check-in/${reservation.id}`)}>
                Check In
              </Button>
            )}
            {reservation.status === 'CHECKED_IN' && (
              <Button variant="secondary" onClick={() => navigate(`/front-desk/check-out/${reservation.id}`)}>
                Check Out
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Guest</h3>
          {primaryGuest ? (
            <>
              <p className="font-semibold">{primaryGuest.firstName} {primaryGuest.lastName}</p>
              <p className="text-sm text-gray-500">{primaryGuest.email}</p>
              <p className="text-sm text-gray-500">{primaryGuest.phone}</p>
            </>
          ) : <p className="text-gray-400">No guest assigned</p>}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Stay</h3>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-500">Check-in:</span> {formatDisplayDate(reservation.checkInDate)}</p>
            <p><span className="text-gray-500">Check-out:</span> {formatDisplayDate(reservation.checkOutDate)}</p>
            <p><span className="text-gray-500">Room Type:</span> {reservation.roomType?.name}</p>
            <p><span className="text-gray-500">Room:</span> {reservation.room?.roomNumber ?? <span className="text-yellow-600">Unassigned</span>}</p>
            <p><span className="text-gray-500">Guests:</span> {reservation.adults} adult(s), {reservation.children} child(ren)</p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Status</h3>
          <Badge label={reservation.status.replace('_', ' ')} className={RESERVATION_STATUS_COLORS[reservation.status.toLowerCase()] ?? ''} />
          <p className="mt-3 text-sm text-gray-500">Source: {reservation.source?.replace('_', ' ')}</p>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Billing</h3>
          <p className="text-2xl font-bold">{formatCurrency(reservation.totalAmount)}</p>
          {(reservation as any).folios?.[0] && (
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => navigate(`/billing/${(reservation as any).folios[0].id}`)}
            >
              View Folio
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
