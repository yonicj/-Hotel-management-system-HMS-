import { create } from 'zustand';

interface Property {
  id: string;
  name: string;
  code: string;
}

interface PropertyStore {
  activeProperty: Property | null;
  setActiveProperty: (p: Property) => void;
}

export const usePropertyStore = create<PropertyStore>((set) => ({
  activeProperty: { id: 'prop-1', name: 'Addis Grand Hotel', code: 'AGH' },
  setActiveProperty: (p) => set({ activeProperty: p }),
}));
