import { useState } from 'react';

export function useLostFound() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
