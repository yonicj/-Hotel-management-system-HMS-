import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsService } from '../services/rooms.service';
import { QUERY_KEYS } from '../lib/constants';
import { useNotificationStore } from '../stores/notification.store';

export function useRooms() {
  return useQuery({ queryKey: QUERY_KEYS.ROOMS, queryFn: roomsService.getAll });
}

export function useRoomAvailability(params: { check_in: string; check_out: string; room_type_id?: string }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ROOMS, 'availability', params],
    queryFn: () => roomsService.getAvailability(params),
    enabled: !!(params.check_in && params.check_out),
  });
}

export function useUpdateRoomStatus() {
  const qc = useQueryClient();
  const { add } = useNotificationStore();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      roomsService.updateStatus(id, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ROOMS });
      add({ type: 'success', title: 'Room status updated' });
    },
  });
}
