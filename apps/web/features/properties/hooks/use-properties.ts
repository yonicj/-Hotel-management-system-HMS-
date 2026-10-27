import { useState } from 'react';

export function useProperties() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
