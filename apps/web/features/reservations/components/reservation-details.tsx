export function ReservationDetails({ reservationId }: { reservationId: string }) {
  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900">Reservation #{reservationId}</h3>
      <p className="text-sm text-slate-500 mt-1">Full stay details, folios, billing breakdown & guest preferences.</p>
    </div>
  );
}
