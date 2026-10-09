import { Bell } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import { formatDisplayDate } from '@hms/shared-utils';

export function Topbar() {
  const user = useCurrentUser();
  const today = formatDisplayDate(new Date());

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500">{today}</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </div>
      </div>
    </header>
  );
}
