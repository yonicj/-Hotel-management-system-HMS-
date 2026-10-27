export function ReservationCard({ id, guest, room, status }: { id: string; guest: string; room: string; status: string }) {
  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
      <div>
        <span className="font-semibold text-slate-900">{guest}</span>
        <p className="text-xs text-slate-500">Room {room} • Ref #{id}</p>
      </div>
      <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800 font-medium">
        {status}
      </span>
    </div>
  );
}
