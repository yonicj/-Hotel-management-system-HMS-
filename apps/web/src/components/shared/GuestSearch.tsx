import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { guestsService } from '../../services/guests.service';
import type { Guest } from '@hms/shared-types';

interface GuestSearchProps {
  onSelect: (guest: Guest) => void;
}

export function GuestSearch({ onSelect }: GuestSearchProps) {
  const [search, setSearch] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['guest-search', search],
    queryFn: () => guestsService.getAll({ search, limit: 8 }),
    enabled: search.length >= 2,
  });

  const guests: Guest[] = data?.data ?? [];

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          className="input pl-9"
          placeholder="Search guest by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search guests"
        />
      </div>

      {search.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {isFetching ? (
            <p className="p-3 text-sm text-gray-400">Searching...</p>
          ) : guests.length === 0 ? (
            <p className="p-3 text-sm text-gray-400">No guests found</p>
          ) : (
            guests.map((guest) => (
              <button
                key={guest.id}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                onClick={() => { onSelect(guest); setSearch(''); }}
              >
                <p className="text-sm font-medium text-gray-900">{guest.firstName} {guest.lastName}</p>
                <p className="text-xs text-gray-500">{guest.email} · {guest.phone}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
