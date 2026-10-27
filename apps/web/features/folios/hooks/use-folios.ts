import { useState } from 'react';

export function useFolios() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
