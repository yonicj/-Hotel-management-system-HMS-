import { useState } from 'react';

export function useHousekeeping() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
