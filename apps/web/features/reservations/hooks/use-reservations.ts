import { useState } from 'react';

export function useReservations() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  return { reservations, loading, setReservations };
}
