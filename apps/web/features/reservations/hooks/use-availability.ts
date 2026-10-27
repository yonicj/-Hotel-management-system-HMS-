import { useState } from 'react';

export function useAvailability() {
  const [availableCount, setAvailableCount] = useState<number>(0);
  return { availableCount, checkAvailability: async () => {} };
}
