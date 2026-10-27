import { useState } from 'react';

export function useDashboard() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
