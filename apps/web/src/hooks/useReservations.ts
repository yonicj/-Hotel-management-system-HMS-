import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsService } from '../services/reservations.service';
import { QUERY_KEYS } from '../lib/constants';
import { useNotificationStore } from '../stores/notification.store';

export function useReservations(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...QUERY_KEYS.RESERVATIONS, params],
    queryFn: () => reservationsService.getAll(params),
  });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.RESERVATIONS, id],
    queryFn: () => reservationsService.getById(id),
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  const { add } = useNotificationStore();
  return useMutation({
    mutationFn: reservationsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.RESERVATIONS });
      add({ type: 'success', title: 'Reservation created' });
    },
    onError: () => add({ type: 'error', title: 'Failed to create reservation' }),
  });
}

export function useConfirmReservation() {
  const qc = useQueryClient();
  const { add } = useNotificationStore();
  return useMutation({
    mutationFn: reservationsService.confirm,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.RESERVATIONS });
      add({ type: 'success', title: 'Reservation confirmed' });
    },
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  const { add } = useNotificationStore();
  return useMutation({
    mutationFn: reservationsService.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.RESERVATIONS });
      add({ type: 'success', title: 'Reservation cancelled' });
    },
  });
}
