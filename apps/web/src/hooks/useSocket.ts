import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@hms/shared-types';
import { useAuthStore } from '../stores/auth.store';
import { useRoomStore } from '../stores/room.store';
import { queryClient } from '../lib/queryClient';
import { QUERY_KEYS } from '../lib/constants';

let socket: Socket | null = null;

export function useSocket() {
  const user = useAuthStore((state) => state.user);
  const { updateRoomStatus } = useRoomStore();
  const connected = useRef(false);

  useEffect(() => {
    if (!user?.hotelId || connected.current) return;

    socket = io({ path: '/socket.io', withCredentials: true });
    connected.current = true;

    socket.on('connect', () => {
      socket?.emit('join:hotel', user.hotelId);
    });

    // Room status updates → Zustand store + invalidate rooms query
    socket.on(SOCKET_EVENTS.ROOM_STATUS_UPDATED, (payload) => {
      updateRoomStatus(payload);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROOMS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROOM_RACK });
    });

    // Reservation events → invalidate relevant queries
    socket.on(SOCKET_EVENTS.RESERVATION_CHECKED_IN, () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ARRIVALS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IN_HOUSE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESERVATIONS });
    });

    socket.on(SOCKET_EVENTS.RESERVATION_CHECKED_OUT, () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEPARTURES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IN_HOUSE });
    });

    // Housekeeping task updates
    socket.on(SOCKET_EVENTS.HOUSEKEEPING_TASK_UPDATED, () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HOUSEKEEPING_TASKS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HOUSEKEEPING_BOARD });
    });

    return () => {
      socket?.disconnect();
      connected.current = false;
    };
  }, [user?.hotelId, updateRoomStatus]);

  return socket;
}
