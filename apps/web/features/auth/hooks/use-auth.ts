import { useState } from 'react';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
