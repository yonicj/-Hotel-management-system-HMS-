import { useState } from 'react';

export function useRates() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
