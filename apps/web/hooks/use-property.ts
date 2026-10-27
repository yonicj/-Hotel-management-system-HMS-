import { usePropertyStore } from '@/stores/property.store';

export function useProperty() {
  const { activeProperty, setActiveProperty } = usePropertyStore();
  return { activeProperty, setActiveProperty };
}
