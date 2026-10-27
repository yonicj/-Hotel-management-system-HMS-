export function ReservationForm() {
  return (
    <form className="space-y-4 bg-white p-6 rounded-xl border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800">New Guest Reservation</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Check-in Date</label>
          <input type="date" className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Check-out Date</label>
          <input type="date" className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm" />
        </div>
      </div>
      <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-500">
        Confirm Booking
      </button>
    </form>
  );
}
