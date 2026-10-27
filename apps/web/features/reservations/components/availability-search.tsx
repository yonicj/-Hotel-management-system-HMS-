export function AvailabilitySearch() {
  return (
    <div className="p-4 bg-slate-100 rounded-lg flex gap-4 items-end">
      <div className="flex-1">
        <label className="text-xs font-semibold text-slate-600 uppercase">Room Type</label>
        <select className="w-full mt-1 p-2 rounded border border-slate-300 text-sm">
          <option>Deluxe King</option>
          <option>Executive Suite</option>
          <option>Standard Twin</option>
        </select>
      </div>
      <button className="px-4 py-2 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800">
        Check Availability
      </button>
    </div>
  );
}
