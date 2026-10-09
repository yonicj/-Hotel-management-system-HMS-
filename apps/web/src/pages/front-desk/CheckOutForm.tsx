import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReservation } from '../../hooks/useReservations';
import { frontDeskService } from '../../services/front-desk.service';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { useNotificationStore } from '../../stores/notification.store';
import { formatCurrency } from '@hms/shared-utils';
import { QUERY_KEYS } from '../../lib/constants';

export default function CheckOutForm() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { add } = useNotificationStore();
  const { data: reservation, isLoading } = useReservation(reservationId!);

  const checkOut = useMutation({
    mutationFn: () => frontDeskService.checkOut(reservationId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.DEPARTURES });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.IN_HOUSE });
      add({ type: 'success', title: 'Guest checked out successfully' });
      navigate('/front-desk/departures');
    },
    onError: (err: any) => add({ type: 'error', title: 'Check-out failed', message: err.response?.data?.message }),
  });

  if (isLoading) return <p className="p-6 text-gray-400">Loading...</p>;
  if (!reservation) return <p className="p-6 text-red-500">Reservation not found</p>;

  const primaryGuest = (reservation as any).reservationGuests?.find((rg: any) => rg.isPrimary)?.guest;

  return (
    <div className="max-w-xl">
      <PageHeader title="Check Out" subtitle={`Reservation ${reservation.confirmationNumber}`} />

      <div className="card space-y-4 mb-6">
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Guest</p>
          <p className="font-semibold">{primaryGuest?.firstName} {primaryGuest?.lastName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Room</p>
          <p className="font-semibold">{reservation.room?.roomNumber}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Charges</p>
          <p className="text-xl font-bold">{formatCurrency(reservation.totalAmount)}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => checkOut.mutate()} loading={checkOut.isPending} variant="primary">
          Confirm Check-Out
        </Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>
    </div>
  );
}
