import { create } from 'zustand';

interface RoomStore {
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  selectedRoomId: null,
  setSelectedRoomId: (id) => set({ selectedRoomId: id }),
}));
