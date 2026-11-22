import { test, expect } from '@playwright/test';

// Import initialized prisma instance from backend
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('../../apps/api/dist/config/database');

test.describe('Phase 3 End-to-End Browser Verification: Hotel Setup & Guest Management', () => {
  const testPhone = '+251911776655';
  const testIdNumber = 'FAYDA-88776655';
  const testGuestFirst = 'Derartu';
  const testGuestLast = 'Tulu';

  test.beforeAll(async () => {
    try {
      if (prisma?.room) {
        await prisma.room.deleteMany({ where: { roomNumber: '301' } });
        await prisma.floor.deleteMany({ where: { floorNumber: 3 } });
        await prisma.roomType.deleteMany({ where: { name: 'Executive Panorama Suite' } });
        await prisma.guest.deleteMany({ where: { phone: testPhone } });
      }
    } catch (e) {
      console.warn('Prisma beforeAll cleanup warning:', e);
    }
  });

  test.afterAll(async () => {
    try {
      if (prisma?.room) {
        await prisma.room.deleteMany({ where: { roomNumber: '301' } });
        await prisma.floor.deleteMany({ where: { floorNumber: 3 } });
        await prisma.roomType.deleteMany({ where: { name: 'Executive Panorama Suite' } });
        await prisma.guest.deleteMany({ where: { phone: testPhone } });
      }
    } catch (e) {
      console.warn('Prisma afterAll cleanup warning:', e);
    }
  });

  test('Flow 1: Hotel Manager logs in, creates a Floor, Room Type, and Room 301 (AVAILABLE)', async ({
    page,
  }) => {
    // 1. Log in via /login as Super Admin / Hotel Manager
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Staff Sign In');

    await page.fill('input[type="email"]', 'admin@grandhotel.com');
    await page.fill('input[type="password"]', 'Admin@1234');
    await page.click('button[type="submit"]');

    // Confirm navigation to /dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.locator('header')).toContainText('Grand HMS Hotel');

    // 2. Navigate to Hotel Setup -> Room Types & Rate Plans (/rates)
    await page.click('aside a[href="/rates"]');
    await page.waitForURL('**/rates', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Room Types & Rate Plans');

    // Create a new Room Type
    await page.click('button:has-text("Add Room Type")');
    await expect(page.locator('h2:has-text("Create Room Type"), h3:has-text("Create Room Type")')).toBeVisible();

    await page.fill('input[placeholder="e.g. Deluxe Double, Executive Suite"]', 'Executive Panorama Suite');
    await page.fill('input[placeholder="2500.00"]', '4500');
    // Select an amenity
    await page.click('button:has-text("High-Speed Wi-Fi")');
    await page.click('button:has-text("Balcony")');

    // Click submit in drawer footer
    const createRoomTypeBtn = page.locator('button:has-text("Create Room Type")').last();
    await createRoomTypeBtn.click();

    // Verify room type appears in table (scoped to table to avoid toast strict-mode ambiguity)
    await expect(
      page.locator('table').getByText('Executive Panorama Suite', { exact: true })
    ).toBeVisible({ timeout: 10000 });

    // 3. Navigate to Floors & Rooms (/rooms)
    await page.click('aside a[href="/rooms"]');
    await page.waitForURL('**/rooms', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Rooms & Floor Management');

    // Create a new Floor (Floor 3)
    await page.click('button:has-text("Add Floor")');
    await expect(page.locator('h3:has-text("Add Hotel Floor")')).toBeVisible();

    await page.fill('input[placeholder="e.g. 1, 2, 3"]', '3');
    await page.fill('input[placeholder="e.g. Executive Club, Garden Wing"]', 'Penthouse Panorama Level');
    await page.click('button:has-text("Create Floor")');

    // Assert Floor 3 appears in the floor filter bar
    await expect(page.locator('button:has-text("Floor 3")')).toBeVisible({ timeout: 10000 });

    // 4. Create Room 301 on Floor 3
    await page.click('button:has-text("Add Room")');
    await expect(page.locator('h2:has-text("Add Room"), h3:has-text("Add Room")')).toBeVisible();

    await page.fill('input[placeholder="e.g. 101, 204-B"]', '301');

    // Select Floor 3
    const floorSelect = page.locator('select').first();
    const floorOptions = await floorSelect.locator('option').all();
    for (const opt of floorOptions) {
      const txt = await opt.innerText();
      if (txt.includes('Floor 3')) {
        const val = await opt.getAttribute('value');
        if (val) await floorSelect.selectOption(val);
        break;
      }
    }

    // Select Executive Panorama Suite
    const roomTypeSelect = page.locator('select').nth(1);
    const roomTypeOptions = await roomTypeSelect.locator('option').all();
    for (const opt of roomTypeOptions) {
      const txt = await opt.innerText();
      if (txt.includes('Executive Panorama Suite')) {
        const val = await opt.getAttribute('value');
        if (val) await roomTypeSelect.selectOption(val);
        break;
      }
    }

    // Submit room creation
    const createRoomBtn = page.locator('button:has-text("Create Room")').last();
    await createRoomBtn.click();

    // 5. Assert Room 301 appears in the room list with AVAILABLE status
    await expect(page.locator('text=Room 301')).toBeVisible({ timeout: 10000 });
    const roomCard = page.locator('div:has-text("Room 301")').last();
    await expect(roomCard.locator('text=Available').first()).toBeVisible();
  });

  test('Flow 2: Receptionist logs in, has restricted sidebar, registers walk-in with no email, and searches', async ({
    page,
  }) => {
    // 1. Start fresh from /login
    await page.goto('/login');

    // If still logged in from previous test, sign out
    const signOutBtn = page.locator('button:has-text("Sign Out")');
    if (await signOutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signOutBtn.click();
      await page.waitForURL('**/login', { timeout: 10000 });
    }

    // 2. Log in as Receptionist
    await page.fill('input[type="email"]', 'receptionist@grandhotel.com');
    await page.fill('input[type="password"]', 'Admin@1234');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.locator('span:has-text("Receptionist")')).toBeVisible({ timeout: 10000 });

    // 3. Verify restricted admin links are hidden in the sidebar
    const aside = page.locator('aside');
    await expect(aside.locator('a[href="/reports"]')).toHaveCount(0);
    await expect(aside.locator('a[href="/housekeeping"]')).toHaveCount(0);
    await expect(aside.locator('a[href="/maintenance"]')).toHaveCount(0);
    await expect(aside.locator('a[href="/settings"]')).toHaveCount(0);

    // Verify receptionist permitted links are visible
    await expect(aside.locator('a[href="/front-desk"]')).toBeVisible();
    await expect(aside.locator('a[href="/reservations"]')).toBeVisible();
    await expect(aside.locator('a[href="/guests"]')).toBeVisible();
    await expect(aside.locator('a[href="/rooms"]')).toBeVisible();

    // 4. Navigate to /guests
    await page.click('aside a[href="/guests"]');
    await page.waitForURL('**/guests', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Guest Directory & Management');

    // 5. Register a walk-in guest with NO email address (only name, phone, and National ID)
    await page.click('button:has-text("Register New Guest")');
    await expect(page.locator('h2:has-text("Register Guest"), h3:has-text("Register Guest")')).toBeVisible();

    await page.fill('input[placeholder="e.g. Abebe"]', testGuestFirst);
    await page.fill('input[placeholder="e.g. Bikila"]', testGuestLast);
    await page.fill('input[placeholder="e.g. +251 911 234 567"]', testPhone);

    // Note: Email input is explicitly left blank!
    const emailInput = page.locator('input[placeholder*="abebe@example.com"]');
    await expect(emailInput).toHaveValue('');

    // Select National ID
    await page.locator('select').first().selectOption('NATIONAL_ID');
    await page.fill('input[placeholder="e.g. ET-1234567890"]', testIdNumber);

    // Click "Register Guest" button in drawer footer
    const registerBtn = page.locator('button:has-text("Register Guest")').last();
    await registerBtn.click();

    // 6. Fast debounced search: Search for that guest by phone number
    const searchInput = page.locator('input[placeholder*="Search by guest name, phone"]');
    await searchInput.fill(testPhone);

    // 7. Confirm they appear in the table
    const table = page.locator('table');
    await expect(table.locator(`text=${testGuestFirst} ${testGuestLast}`)).toBeVisible({ timeout: 10000 });
    await expect(table.locator(`text=${testPhone}`)).toBeVisible();
    await expect(table.locator(`text=${testIdNumber}`)).toBeVisible();
    await expect(table.locator('text=No email (walk-in)')).toBeVisible();
  });
});
