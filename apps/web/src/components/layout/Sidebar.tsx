import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, DoorOpen, Bed,
  Sparkles, Users, CreditCard, Moon, BarChart3,
  Settings, LogOut, Building2,
} from 'lucide-react';
import { useLogout, useCurrentUser } from '../../hooks/useAuth';
import clsx from 'clsx';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Reservations', icon: CalendarDays, to: '/reservations' },
  {
    label: 'Front Desk', icon: DoorOpen, children: [
      { label: 'Arrivals', to: '/front-desk/arrivals' },
      { label: 'Departures', to: '/front-desk/departures' },
      { label: 'In-House', to: '/front-desk/in-house' },
    ],
  },
  {
    label: 'Rooms', icon: Bed, children: [
      { label: 'Room Rack', to: '/rooms/rack' },
      { label: 'Room List', to: '/rooms' },
    ],
  },
  { label: 'Housekeeping', icon: Sparkles, to: '/housekeeping' },
  { label: 'Guests', icon: Users, to: '/guests' },
  { label: 'Billing', icon: CreditCard, to: '/billing' },
  { label: 'Night Audit', icon: Moon, to: '/night-audit' },
  {
    label: 'Reports', icon: BarChart3, children: [
      { label: 'Occupancy', to: '/reports/occupancy' },
      { label: 'Revenue', to: '/reports/revenue' },
    ],
  },
  {
    label: 'Settings', icon: Settings, children: [
      { label: 'Users', to: '/settings/users' },
      { label: 'Roles', to: '/settings/roles' },
      { label: 'Room Types', to: '/settings/room-types' },
      { label: 'Rate Plans', to: '/settings/rate-plans' },
    ],
  },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors', {
    'bg-primary-600 text-white': isActive,
    'text-gray-600 hover:bg-gray-100 hover:text-gray-900': !isActive,
  });

export function Sidebar() {
  const logout = useLogout();
  const user = useCurrentUser();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">HMS</p>
          <p className="text-xs text-gray-500">Hotel Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) =>
          item.children ? (
            <div key={item.label}>
              <p className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">
                <item.icon className="w-4 h-4" />
                {item.label}
              </p>
              <div className="ml-3 space-y-0.5">
                {item.children.map((child) => (
                  <NavLink key={child.to} to={child.to} className={linkClass}>
                    {child.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ) : (
            <NavLink key={item.to} to={item.to!} className={linkClass}>
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={() => logout.mutate()}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
