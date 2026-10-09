import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReservation } from '../../hooks/useReservations';
import { frontDeskService } from '../../services/front-desk.service';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { useNotificationStore } from '../../stores/notification.store';
import { formatDisplayDate } from '@hms/shared-utils';
import { QUERY_KEYS } from '../../lib/constants';

export default function CheckInForm() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { add } = useNotificationStore();
  const { data: reservation, isLoading } = useReservation(reservationId!);

  const checkIn = useMutation({
    mutationFn: () => frontDeskService.checkIn(reservationId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ARRIVALS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.IN_HOUSE });
      add({ type: 'success', title: 'Guest checked in successfully' });
      navigate('/front-desk/in-house');
    },
    onError: (err: any) => add({ type: 'error', title: 'Check-in failed', message: err.response?.data?.message }),
  });

  if (isLoading) return <p className="p-6 text-gray-400">Loading...</p>;
  if (!reservation) return <p className="p-6 text-red-500">Reservation not found</p>;

  const primaryGuest = (reservation as any).reservationGuests?.find((rg: any) => rg.isPrimary)?.guest;

  return (
    <div className="max-w-xl">
      <PageHeader title="Check In" subtitle={`Reservation ${reservation.confirmationNumber}`} />

      <div className="card space-y-4 mb-6">
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Guest</p>
          <p className="font-semibold">{primaryGuest?.firstName} {primaryGuest?.lastName}</p>
          <p className="text-sm text-gray-500">{primaryGuest?.email} · {primaryGuest?.phone}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Room</p>
          <p className="font-semibold">{reservation.room?.roomNumber ?? <span className="text-red-500">No room assigned</span>}</p>
          <p className="text-sm text-gray-500">{reservation.roomType?.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Stay</p>
          <p className="text-sm">{formatDisplayDate(reservation.checkInDate)} → {formatDisplayDate(reservation.checkOutDate)}</p>
        </div>
      </div>

      {!reservation.roomId && (
        <p className="text-sm text-red-600 mb-4">⚠ Please assign a room before checking in.</p>
      )}

      <div className="flex gap-3">
        <Button
          onClick={() => checkIn.mutate()}
          loading={checkIn.isPending}
          disabled={!reservation.roomId}
        >
          Confirm Check-In
        </Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>
    </div>
  );
}
