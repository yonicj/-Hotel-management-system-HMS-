import { test, expect } from '@playwright/test';

// Import initialized prisma instance from backend
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { prisma } = require('../../apps/api/dist/config/database');

test.describe('Phase 4 End-to-End Verification: Reservations, Availability & Timeline', () => {
  const testGuestPhone = '+251911223344';
  let createdReservationId: string | null = null;

  test.beforeAll(async () => {
    try {
      if (prisma) {
        // Ensure seeded guest exists
        let guest = await prisma.guest.findFirst({
          where: {
            OR: [
              { email: 'abebe.e2e@runner.et' },
              { phone: testGuestPhone },
            ],
          },
        });

        if (!guest) {
          guest = await prisma.guest.create({
            data: {
              firstName: 'Abebe',
              lastName: 'Bikila',
              phone: testGuestPhone,
              email: 'abebe.e2e@runner.et',
              idType: 'PASSPORT',
              idNumber: 'P-12345678',
            },
          });
        }

        // Clean up any existing reservations for Room 101 on test dates
        const existingRes = await prisma.reservation.findMany({
          where: {
            room: { roomNumber: '101' },
            checkInDate: { lte: new Date('2026-12-14') },
            checkOutDate: { gte: new Date('2026-12-10') },
          },
          select: { id: true },
        });

        if (existingRes.length > 0) {
          const ids = existingRes.map((r: { id: string }) => r.id);
          await prisma.folioCharge.deleteMany({
            where: { folio: { reservationId: { in: ids } } },
          });
          await prisma.folio.deleteMany({
            where: { reservationId: { in: ids } },
          });
          await prisma.reservationGuest.deleteMany({
            where: { reservationId: { in: ids } },
          });
          await prisma.reservation.deleteMany({
            where: { id: { in: ids } },
          });
        }
      }
    } catch (e) {
      console.warn('Prisma beforeAll cleanup warning:', e);
    }
  });

  test.afterAll(async () => {
    try {
      if (prisma && createdReservationId) {
        await prisma.folioCharge.deleteMany({
          where: { folio: { reservationId: createdReservationId } },
        });
        await prisma.folio.deleteMany({
          where: { reservationId: createdReservationId },
        });
        await prisma.reservationGuest.deleteMany({
          where: { reservationId: createdReservationId },
        });
        await prisma.reservation.deleteMany({
          where: { id: createdReservationId },
        });
      }
    } catch (e) {
      console.warn('Prisma afterAll cleanup warning:', e);
    }
  });

  test('Full Reservation Flow: Search availability, book Room 101, verify in List and Timeline, confirm, and cancel', async ({
    page,
  }) => {
    // ─────────────────────────────────────────────────────────────────────────
    // 1. Log in as Receptionist
    // ─────────────────────────────────────────────────────────────────────────
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Staff Sign In');

    await page.fill('input[type="email"]', 'receptionist@grandhotel.com');
    await page.fill('input[type="password"]', 'Admin@1234');
    await page.click('button[type="submit"]');

    // Confirm navigation to /dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.locator('header')).toContainText('Grand HMS Hotel');

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Navigate to /reservations
    // ─────────────────────────────────────────────────────────────────────────
    await page.click('aside a[href="/reservations"]');
    await page.waitForURL('**/reservations', { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Reservations & Availability');

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Search Availability for future date range (2026-12-10 to 2026-12-14)
    // ─────────────────────────────────────────────────────────────────────────
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.nth(0).fill('2026-12-10');
    await dateInputs.nth(1).fill('2026-12-14');

    await page.click('button:has-text("Check Availability")');

    // Verify available rooms list appears and Room 101 is available
    await expect(page.locator('text=available rooms', { exact: false })).toBeVisible({
      timeout: 10000,
    });
    const room101Card = page
      .locator('div.p-4', { hasText: 'Room 101' })
      .filter({ has: page.locator('button:has-text("Book Now")') })
      .first();
    await expect(room101Card).toBeVisible({ timeout: 10000 });
    await expect(room101Card.locator('button:has-text("Book Now")')).toBeVisible();

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Create New Reservation for Seeded Guest
    // ─────────────────────────────────────────────────────────────────────────
    // Click "Book Now" on Room 101 to open drawer pre-filled with dates and room
    await room101Card.locator('button:has-text("Book Now")').click();

    // Verify New Reservation drawer is open
    await expect(
      page.locator('h2:has-text("New Reservation")')
    ).toBeVisible({ timeout: 5000 });

    // Search and select seeded guest "Abebe Bikila"
    const guestSearch = page.locator('input[placeholder*="Search guest by name"]');
    await guestSearch.fill('Abebe');

    const guestOption = page.locator('div.cursor-pointer', { hasText: 'Abebe Bikila' }).first();
    await expect(guestOption).toBeVisible({ timeout: 10000 });
    await guestOption.click();

    // Confirm guest is attached (shows "Change" link)
    await expect(page.locator('button:has-text("Change")')).toBeVisible();

    // Click "Confirm & Create" button
    const confirmCreateBtn = page.locator('button:has-text("Confirm & Create")');
    await confirmCreateBtn.click();

    // Wait for success toast
    await expect(page.locator('text=Reservation Created')).toBeVisible({ timeout: 10000 });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Verify New Reservation Appears in List View
    // ─────────────────────────────────────────────────────────────────────────
    // Make sure we are on the List View
    await page.click('button:has-text("List View")');

    const table = page.locator('table');
    await expect(table.locator('text=Abebe Bikila').first()).toBeVisible({ timeout: 10000 });
    await expect(table.locator('text=Room 101').first()).toBeVisible();

    // Capture confirmation number
    const firstRow = table.locator('tbody tr').first();
    const confNumberCell = firstRow.locator('td').first();
    const confNumber = (await confNumberCell.innerText()).trim();
    expect(confNumber.length).toBeGreaterThan(0);

    // Track for DB cleanup
    const dbRes = await prisma.reservation.findFirst({
      where: { confirmationNumber: confNumber },
      select: { id: true },
    });
    if (dbRes) createdReservationId = dbRes.id;

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Verify New Reservation Appears in Timeline View
    // ─────────────────────────────────────────────────────────────────────────
    await page.click('button:has-text("Timeline Grid")');

    // The timeline view is now visible
    await expect(page.locator('span:has-text("Room / Unit")')).toBeVisible({ timeout: 10000 });

    // Shift window forward so Dec 10-14 is visible
    await page.click('button[title="Next window"]');

    // Verify that a reservation bar for Abebe Bikila is displayed on the timeline
    await expect(
      page.locator('div[title*="Abebe Bikila"]').first()
    ).toBeVisible({ timeout: 10000 });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Re-search Availability: Room 101 is No Longer Free
    // ─────────────────────────────────────────────────────────────────────────
    // Re-enter the same dates in availability search
    await dateInputs.nth(0).fill('2026-12-10');
    await dateInputs.nth(1).fill('2026-12-14');
    await page.click('button:has-text("Check Availability")');

    // Confirm Room 101 is NOT listed among available rooms
    await page.waitForTimeout(1000); // Allow query to settle
    const room101Available = page
      .locator('div.p-4', { hasText: 'Room 101' })
      .filter({ has: page.locator('button:has-text("Book Now")') });
    await expect(room101Available).toHaveCount(0);

    // ─────────────────────────────────────────────────────────────────────────
    // 8. Open Reservation, Confirm It, Then Cancel It Via UI
    // ─────────────────────────────────────────────────────────────────────────
    // Switch back to List View
    await page.click('button:has-text("List View")');
    await expect(table).toBeVisible();

    // Click "Details" on the reservation row
    await firstRow.locator('button:has-text("Details")').click();

    // Verify details drawer opened
    await expect(page.locator(`h2:has-text("Reservation #${confNumber}")`)).toBeVisible({
      timeout: 5000,
    });

    // Confirm the reservation
    const confirmBtn = page.locator('button:has-text("Confirm Reservation")');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Wait for "Reservation Confirmed" toast
    await expect(page.locator('text=Reservation Confirmed')).toBeVisible({ timeout: 10000 });

    // Cancel the reservation
    const cancelBtn = page.locator('button:has-text("Cancel Booking")');
    await expect(cancelBtn).toBeVisible({ timeout: 5000 });
    await cancelBtn.click();

    // Confirm dialog opens
    await expect(page.locator('h3:has-text("Cancel Reservation")')).toBeVisible({ timeout: 5000 });
    const modalConfirmBtn = page.locator('button:has-text("Yes, Cancel Booking")');
    await modalConfirmBtn.click();

    // Wait for "Reservation Cancelled" toast
    await expect(page.locator('text=Reservation Cancelled')).toBeVisible({ timeout: 10000 });

    // Verify the status in the table is now CANCELLED
    await expect(table.locator('text=Cancelled').first()).toBeVisible({ timeout: 10000 });
  });
});
