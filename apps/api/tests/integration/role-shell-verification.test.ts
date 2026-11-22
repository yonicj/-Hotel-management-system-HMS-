import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

interface NavItem {
  label: string;
  href: string;
  perms?: string | string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Front Desk', href: '/front-desk', perms: 'front_desk:read' },
  { label: 'Reservations', href: '/reservations', perms: 'reservations:read' },
  { label: 'Guests', href: '/guests', perms: 'guests:read' },
  { label: 'Rooms & Status', href: '/rooms', perms: 'rooms:read' },
  { label: 'Housekeeping', href: '/housekeeping', perms: 'housekeeping:read' },
  { label: 'Maintenance', href: '/maintenance', perms: 'maintenance:read' },
  { label: 'Folios', href: '/folios', perms: 'billing:read' },
  { label: 'Cashier', href: '/cashier', perms: ['billing:create', 'billing:read'] },
  { label: 'Payments', href: '/payments', perms: 'billing:read' },
  { label: 'Invoices', href: '/invoices', perms: 'billing:read' },
  { label: 'Rates & Plans', href: '/rates', perms: 'rate_plans:read' },
  { label: 'Reports', href: '/reports', perms: 'reports:read' },
  { label: 'Settings', href: '/settings', perms: ['users:read', 'roles:read'] },
];

function filterSidebarForUser(user: { role: string; permissions: string[] }): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (user.role === 'Super Admin' || user.role === 'SUPER_ADMIN') {
      return true;
    }
    if (!item.perms) {
      return true;
    }
    const userPerms = user.permissions || [];
    if (Array.isArray(item.perms)) {
      return item.perms.some((p) => userPerms.includes(p));
    }
    return userPerms.includes(item.perms);
  });
}

describe('Role-Aware App Shell & Auth Session Verification', () => {
  it('authenticates admin@grandhotel.com, fetches /api/auth/me, and grants full sidebar access', async () => {
    // 1. POST /api/auth/login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@grandhotel.com', password: 'Admin@1234' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const { accessToken, refreshToken, user: loginUser } = loginRes.body.data;
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(loginUser.email).toBe('admin@grandhotel.com');

    // 2. GET /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    const meUser = meRes.body.data;
    expect(meUser.role).toBe('Super Admin');
    expect(Array.isArray(meUser.permissions)).toBe(true);

    // 3. Verify Full Sidebar Navigation
    const visibleNavItems = filterSidebarForUser(meUser);
    expect(visibleNavItems.length).toBe(NAV_ITEMS.length);
    const visibleHrefs = visibleNavItems.map((i) => i.href);

    expect(visibleHrefs).toContain('/dashboard');
    expect(visibleHrefs).toContain('/front-desk');
    expect(visibleHrefs).toContain('/reservations');
    expect(visibleHrefs).toContain('/guests');
    expect(visibleHrefs).toContain('/rooms');
    expect(visibleHrefs).toContain('/housekeeping');
    expect(visibleHrefs).toContain('/maintenance');
    expect(visibleHrefs).toContain('/folios');
    expect(visibleHrefs).toContain('/cashier');
    expect(visibleHrefs).toContain('/payments');
    expect(visibleHrefs).toContain('/invoices');
    expect(visibleHrefs).toContain('/rates');
    expect(visibleHrefs).toContain('/reports');
    expect(visibleHrefs).toContain('/settings');
  });

  it('authenticates housekeeper@grandhotel.com, fetches /api/auth/me, and strictly hides Rates, Reports, Billing, etc.', async () => {
    // 1. POST /api/auth/login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'housekeeper@grandhotel.com', password: 'Admin@1234' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    const { accessToken, user: loginUser } = loginRes.body.data;
    expect(loginUser.email).toBe('housekeeper@grandhotel.com');

    // 2. GET /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    const meUser = meRes.body.data;
    expect(meUser.role).toBe('Housekeeper');
    expect(Array.isArray(meUser.permissions)).toBe(true);

    // 3. Verify Filtered Role Navigation
    const visibleNavItems = filterSidebarForUser(meUser);
    const visibleHrefs = visibleNavItems.map((i) => i.href);

    // Permitted Routes
    expect(visibleHrefs).toContain('/dashboard');
    expect(visibleHrefs).toContain('/rooms');
    expect(visibleHrefs).toContain('/housekeeping');
    expect(visibleHrefs).toContain('/maintenance');

    // Strictly Blocked / Hidden Routes
    expect(visibleHrefs).not.toContain('/rates');
    expect(visibleHrefs).not.toContain('/reports');
    expect(visibleHrefs).not.toContain('/folios');
    expect(visibleHrefs).not.toContain('/cashier');
    expect(visibleHrefs).not.toContain('/payments');
    expect(visibleHrefs).not.toContain('/invoices');
    expect(visibleHrefs).not.toContain('/front-desk');
    expect(visibleHrefs).not.toContain('/reservations');
    expect(visibleHrefs).not.toContain('/guests');
    expect(visibleHrefs).not.toContain('/settings');
  });
});
