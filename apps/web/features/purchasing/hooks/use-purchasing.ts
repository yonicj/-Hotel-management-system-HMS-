import { useState } from 'react';

export function usePurchasing() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
