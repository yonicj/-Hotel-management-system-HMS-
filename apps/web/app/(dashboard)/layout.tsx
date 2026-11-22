'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import {
  Hotel,
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Sparkles,
  Wrench,
  Users,
  FileSpreadsheet,
  Wallet,
  CreditCard,
  Receipt,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  Clock,
  Menu,
  X,
  Bell,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  perms?: string | string[];
}

const NAV_GROUPS: { groupName?: string; items: NavItem[] }[] = [
  {
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    groupName: 'Front Office',
    items: [
      {
        label: 'Front Desk',
        href: '/front-desk',
        icon: Bell,
        perms: 'front_desk:read',
      },
      {
        label: 'Reservations',
        href: '/reservations',
        icon: CalendarDays,
        perms: 'reservations:read',
      },
      {
        label: 'Guests',
        href: '/guests',
        icon: Users,
        perms: 'guests:read',
      },
    ],
  },
  {
    groupName: 'Operations',
    items: [
      {
        label: 'Rooms & Status',
        href: '/rooms',
        icon: BedDouble,
        perms: 'rooms:read',
      },
      {
        label: 'Housekeeping',
        href: '/housekeeping',
        icon: Sparkles,
        perms: 'housekeeping:read',
      },
      {
        label: 'Maintenance',
        href: '/maintenance',
        icon: Wrench,
        perms: 'maintenance:read',
      },
    ],
  },
  {
    groupName: 'Finance & Billing',
    items: [
      {
        label: 'Folios',
        href: '/folios',
        icon: FileSpreadsheet,
        perms: 'billing:read',
      },
      {
        label: 'Cashier',
        href: '/cashier',
        icon: Wallet,
        perms: ['billing:create', 'billing:read'],
      },
      {
        label: 'Payments',
        href: '/payments',
        icon: CreditCard,
        perms: 'billing:read',
      },
      {
        label: 'Invoices',
        href: '/invoices',
        icon: Receipt,
        perms: 'billing:read',
      },
    ],
  },
  {
    groupName: 'Management',
    items: [
      {
        label: 'Rates & Plans',
        href: '/rates',
        icon: Tag,
        perms: 'rate_plans:read',
      },
      {
        label: 'Reports',
        href: '/reports',
        icon: BarChart3,
        perms: 'reports:read',
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        perms: ['users:read', 'roles:read'],
      },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout, setAuth } = useAuthStore();

  const [isChecked, setIsChecked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ─── 1. Authenticated Route Protection ─────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function verifyAuth() {
      const activeToken =
        token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null);

      if (!activeToken) {
        router.replace('/login');
        return;
      }

      try {
        // Fetch fresh profile & permissions from /api/auth/me
        const meRes = await apiClient.get('/auth/me');
        const freshUser = meRes.data?.data ?? meRes.data;

        if (isMounted && freshUser) {
          setAuth(freshUser, activeToken);
          setIsChecked(true);
        }
      } catch (err: any) {
        if (isMounted) {
          logout();
          router.replace('/login');
        }
      }
    }

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [router, token, setAuth, logout]);

  // ─── 2. Logout Handler ─────────────────────────────────────────────────────
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      logout();
      router.replace('/login');
    }
  };

  // ─── 3. Permission Filter ──────────────────────────────────────────────────
  const canAccess = (perms?: string | string[]): boolean => {
    if (!user) return false;
    // Super Admin has full unrestricted access
    if (user.role === 'Super Admin' || user.role === 'SUPER_ADMIN') {
      return true;
    }
    // No specific permission required
    if (!perms) {
      return true;
    }
    const userPerms = user.permissions || [];
    if (Array.isArray(perms)) {
      return perms.some((p) => userPerms.includes(p));
    }
    return userPerms.includes(perms);
  };

  // Show splash loading screen while verifying credentials
  if (!isChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium tracking-wide">
          Verifying hospitality session...
        </p>
      </div>
    );
  }

  const userFullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.name || user?.email || 'Staff Member';

  const roleName = user?.role || 'Staff';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ─── Mobile Sidebar Overlay ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Role-Aware Sidebar ────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight">EHMS Core</div>
              <div className="text-[10px] text-emerald-400 font-medium">Grand HMS Hotel</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Role-Filtered) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {NAV_GROUPS.map((group, gIdx) => {
            const accessibleItems = group.items.filter((item) => canAccess(item.perms));
            if (accessibleItems.length === 0) return null;

            return (
              <div key={group.groupName || `g-${gIdx}`} className="space-y-1">
                {group.groupName && (
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {group.groupName}
                  </div>
                )}
                {accessibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Card & Logout (Bottom) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-inner">
              {userFullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{userFullName}</div>
              <div className="text-[10px] text-emerald-400 font-medium truncate">{roleName}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full py-2 px-3 rounded-lg border border-slate-700 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 text-xs font-medium transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
          {/* Left: Mobile Toggle & Hotel Indicator */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="font-bold text-slate-900 text-sm">Grand HMS Hotel</span>
                <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 border-l border-slate-200 pl-2">
                  Addis Ababa • Africa/Addis_Ababa
                </span>
              </div>
            </div>
          </div>

          {/* Right: Role Badge & Profile */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>EAT (UTC+3)</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900">{userFullName}</div>
                <div className="text-[10px] text-slate-500">{user?.email}</div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                {roleName}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
