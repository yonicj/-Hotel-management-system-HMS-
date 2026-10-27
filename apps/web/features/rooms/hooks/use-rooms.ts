import { useState } from 'react';

export function useRooms() {
  const [loading, setLoading] = useState(false);
  return { loading, setLoading };
}
