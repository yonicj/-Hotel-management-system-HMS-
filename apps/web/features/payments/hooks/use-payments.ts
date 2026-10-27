import { useState } from 'react';

export function usePayments() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
