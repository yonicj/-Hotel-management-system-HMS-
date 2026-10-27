import { useState } from 'react';

export function useGuests() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
