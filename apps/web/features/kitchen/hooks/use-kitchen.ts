import { useState } from 'react';

export function useKitchen() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
