import { useState } from 'react';

export function useMaintenance() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
