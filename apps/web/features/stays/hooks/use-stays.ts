import { useState } from 'react';

export function useStays() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
