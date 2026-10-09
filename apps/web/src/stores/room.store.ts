import { create } from 'zustand';
import type { RoomStatusUpdatedPayload } from '@hms/shared-types';

interface RoomState {
  // Map of roomId → latest status update (real-time)
  roomStatuses: Record<string, RoomStatusUpdatedPayload>;
  updateRoomStatus: (payload: RoomStatusUpdatedPayload) => void;
  clearRoomStatuses: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomStatuses: {},

  updateRoomStatus: (payload) =>
    set((state) => ({
      roomStatuses: { ...state.roomStatuses, [payload.roomId]: payload },
    })),

  clearRoomStatuses: () => set({ roomStatuses: {} }),
}));
