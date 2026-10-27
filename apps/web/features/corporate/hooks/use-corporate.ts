import { useState } from 'react';

export function useCorporate() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
