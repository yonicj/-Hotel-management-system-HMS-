import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';

describe('Phase 4: Concurrency & Lifecycle Integration Tests', () => {
  let receptionistToken: string;
  let hotelId: string;
  let singleRoomTypeId: string;
  let testFloorId: string;
  let testRoomAId: string;
  let concurrencyRoomId: string;
  let testGuest1Id: string;
  let testGuest2Id: string;

  const testSuffix = Date.now().toString().slice(-6);
  const createdReservationIds: string[] = [];
  const createdRoomIds: string[] = [];
  const createdGuestIds: string[] = [];

  beforeAll(async () => {
    // 1. Authenticate as Receptionist (who has reservations create/read/update permissions)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'receptionist@grandhotel.com', password: 'Admin@1234' });

    expect(loginRes.status).toBe(200);
    receptionistToken = loginRes.body.data.accessToken;

    const hotel = await prisma.hotel.findFirst();
    const roomType = await prisma.roomType.findFirst({ where: { name: 'Standard Single' } });
    const floor = await prisma.floor.findFirst({ where: { hotelId: hotel!.id } });

    if (!hotel || !roomType || !floor) {
      throw new Error('Database is not seeded properly');
    }

    hotelId = hotel.id;
    singleRoomTypeId = roomType.id;
    testFloorId = floor.id;

    // 2. Create test guests
    const guest1 = await prisma.guest.create({
      data: {
        firstName: 'Kenenisa',
        lastName: `Bekele-${testSuffix}`,
        phone: `+251911${testSuffix}`,
        email: `kenenisa.${testSuffix}@runner.et`,
        idType: 'PASSPORT',
        idNumber: `P1-${testSuffix}`,
      },
    });
    testGuest1Id = guest1.id;
    createdGuestIds.push(guest1.id);

    const guest2 = await prisma.guest.create({
      data: {
        firstName: 'Haile',
        lastName: `Gebrselassie-${testSuffix}`,
        phone: `+251933${testSuffix}`,
        email: `haile.${testSuffix}@runner.et`,
        idType: 'PASSPORT',
        idNumber: `P2-${testSuffix}`,
      },
    });
    testGuest2Id = guest2.id;
    createdGuestIds.push(guest2.id);

    // 3. Create dedicated test rooms
    // Room A (for lifecycle tests)
    const roomA = await prisma.room.create({
      data: {
        hotelId,
        roomTypeId: singleRoomTypeId,
        floorId: testFloorId,
        roomNumber: `801-${testSuffix}`,
        status: 'AVAILABLE',
      },
    });
    testRoomAId = roomA.id;
    createdRoomIds.push(roomA.id);

    // Concurrency Room (for race condition tests)
    const roomC = await prisma.room.create({
      data: {
        hotelId,
        roomTypeId: singleRoomTypeId,
        floorId: testFloorId,
        roomNumber: `802-${testSuffix}`,
        status: 'AVAILABLE',
      },
    });
    concurrencyRoomId = roomC.id;
    createdRoomIds.push(roomC.id);
  });

  afterAll(async () => {
    // Cleanup reservations, folios, rooms, and guests
    if (createdReservationIds.length > 0) {
      await prisma.folioCharge.deleteMany({
        where: { folio: { reservationId: { in: createdReservationIds } } },
      });
      await prisma.folio.deleteMany({
        where: { reservationId: { in: createdReservationIds } },
      });
      await prisma.reservationGuest.deleteMany({
        where: { reservationId: { in: createdReservationIds } },
      });
      await prisma.reservation.deleteMany({
        where: { id: { in: createdReservationIds } },
      });
    }

    if (createdRoomIds.length > 0) {
      await prisma.room.deleteMany({
        where: { id: { in: createdRoomIds } },
      });
    }

    if (createdGuestIds.length > 0) {
      await prisma.guest.deleteMany({
        where: { id: { in: createdGuestIds } },
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Part 1: Availability & Lifecycle Tests
  // ───────────────────────────────────────────────────────────────────────────
  describe('Availability & Lifecycle', () => {
    let confirmedResId: string;

    it('excludes rooms with overlapping CONFIRMED bookings, but includes rooms for back-to-back dates', async () => {
      // Create a booking on testRoomA for 2026-12-10 to 2026-12-15
      const createRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          guestId: testGuest1Id,
          roomTypeId: singleRoomTypeId,
          roomId: testRoomAId,
          checkInDate: '2026-12-10',
          checkOutDate: '2026-12-15',
          adults: 1,
        });

      expect(createRes.status).toBe(201);
      confirmedResId = createRes.body.data.id;
      createdReservationIds.push(confirmedResId);

      // Confirm the reservation
      const confirmRes = await request(app)
        .patch(`/api/reservations/${confirmedResId}/confirm`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.data.status).toBe('CONFIRMED');

      // 1. Search overlapping date range (Dec 12 - Dec 14) -> room must be EXCLUDED
      const overlapSearch = await request(app)
        .get('/api/rooms/availability')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .query({
          checkInDate: '2026-12-12',
          checkOutDate: '2026-12-14',
          roomTypeId: singleRoomTypeId,
        });

      expect(overlapSearch.status).toBe(200);
      const overlapRoomIds = overlapSearch.body.data.map((r: any) => r.id);
      expect(overlapRoomIds).not.toContain(testRoomAId);

      // 2. Search back-to-back date range (Dec 15 - Dec 18):
      // existing checkout is Dec 15, new check-in is Dec 15 -> room must be INCLUDED
      const backToBackAfterSearch = await request(app)
        .get('/api/rooms/availability')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .query({
          checkInDate: '2026-12-15',
          checkOutDate: '2026-12-18',
          roomTypeId: singleRoomTypeId,
        });

      expect(backToBackAfterSearch.status).toBe(200);
      const afterRoomIds = backToBackAfterSearch.body.data.map((r: any) => r.id);
      expect(afterRoomIds).toContain(testRoomAId);

      // 3. Search back-to-back date range before (Dec 07 - Dec 10):
      // existing check-in is Dec 10, new checkout is Dec 10 -> room must be INCLUDED
      const backToBackBeforeSearch = await request(app)
        .get('/api/rooms/availability')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .query({
          checkInDate: '2026-12-07',
          checkOutDate: '2026-12-10',
          roomTypeId: singleRoomTypeId,
        });

      expect(backToBackBeforeSearch.status).toBe(200);
      const beforeRoomIds = backToBackBeforeSearch.body.data.map((r: any) => r.id);
      expect(beforeRoomIds).toContain(testRoomAId);
    });

    it('modifying dates updates the rate cleanly and rejects dates that collide with another booking (409 ROOM_UNAVAILABLE)', async () => {
      // Create a separate booking on testRoomA for 2026-12-01 to 2026-12-03 (2 nights)
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          guestId: testGuest2Id,
          roomTypeId: singleRoomTypeId,
          roomId: testRoomAId,
          checkInDate: '2026-12-01',
          checkOutDate: '2026-12-03',
          adults: 1,
        });

      expect(res.status).toBe(201);
      const modifiableResId = res.body.data.id;
      createdReservationIds.push(modifiableResId);

      const initialAmount = Number(res.body.data.totalAmount);
      expect(initialAmount).toBeGreaterThan(0);

      // Extend to 4 nights (2026-12-01 to 2026-12-05) -> cleanly updates rate via Decimal
      const modifyRes = await request(app)
        .patch(`/api/reservations/${modifiableResId}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          checkOutDate: '2026-12-05',
        });

      expect(modifyRes.status).toBe(200);
      const updatedAmount = Number(modifyRes.body.data.totalAmount);
      expect(updatedAmount).toBeCloseTo(initialAmount * 2, 2);

      // Attempt to modify dates to collide with the confirmed Dec 10-15 booking (e.g. Dec 08 - Dec 12)
      const collideRes = await request(app)
        .patch(`/api/reservations/${modifiableResId}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          checkInDate: '2026-12-08',
          checkOutDate: '2026-12-12',
        });

      expect(collideRes.status).toBe(409);
      expect(collideRes.body.error.code).toBe('ROOM_UNAVAILABLE');
    });

    it('cancelling a CONFIRMED reservation frees the room up again in availability search and writes an AuditLog entry', async () => {
      // Cancel the confirmed reservation (Dec 10 - Dec 15)
      const cancelRes = await request(app)
        .post(`/api/reservations/${confirmedResId}/cancel`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');

      // Room should now be available for Dec 10 - Dec 15
      const availRes = await request(app)
        .get('/api/rooms/availability')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .query({
          checkInDate: '2026-12-11',
          checkOutDate: '2026-12-14',
          roomTypeId: singleRoomTypeId,
        });

      expect(availRes.status).toBe(200);
      const roomIds = availRes.body.data.map((r: any) => r.id);
      expect(roomIds).toContain(testRoomAId);

      // Verify AuditLog entry was written
      const auditEntry = await prisma.auditLog.findFirst({
        where: {
          entityId: confirmedResId,
          action: 'RESERVATION_CANCELLED',
        },
      });

      expect(auditEntry).not.toBeNull();
      expect(auditEntry?.entityType).toBe('Reservation');
      expect(auditEntry?.action).toBe('RESERVATION_CANCELLED');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Part 2: Race-Condition / Concurrency Test
  // ───────────────────────────────────────────────────────────────────────────
  describe('Race-Condition / Concurrency Test', () => {
    it('simultaneous requests for the exact same room and overlapping dates yield exactly one 201 and one 409', async () => {
      const dates = {
        checkInDate: '2026-12-20',
        checkOutDate: '2026-12-23',
      };

      // Fire two simultaneous requests targeting the exact same roomId and overlapping dates
      const [res1Result, res2Result] = await Promise.allSettled([
        request(app)
          .post('/api/reservations')
          .set('Authorization', `Bearer ${receptionistToken}`)
          .send({
            guestId: testGuest1Id,
            roomTypeId: singleRoomTypeId,
            roomId: concurrencyRoomId,
            checkInDate: dates.checkInDate,
            checkOutDate: dates.checkOutDate,
            adults: 1,
          }),
        request(app)
          .post('/api/reservations')
          .set('Authorization', `Bearer ${receptionistToken}`)
          .send({
            guestId: testGuest2Id,
            roomTypeId: singleRoomTypeId,
            roomId: concurrencyRoomId,
            checkInDate: dates.checkInDate,
            checkOutDate: dates.checkOutDate,
            adults: 1,
          }),
      ]);

      // Both HTTP requests must have settled cleanly
      expect(res1Result.status).toBe('fulfilled');
      expect(res2Result.status).toBe('fulfilled');

      const res1 = (res1Result as PromiseFulfilledResult<request.Response>).value;
      const res2 = (res2Result as PromiseFulfilledResult<request.Response>).value;

      const statuses = [res1.status, res2.status];

      // Exactly one request must succeed (201) and exactly one must fail with 409
      expect(statuses).toContain(201);
      expect(statuses).toContain(409);

      const successResponse = res1.status === 201 ? res1 : res2;
      const conflictResponse = res1.status === 409 ? res1 : res2;

      // Track successful reservation for cleanup
      createdReservationIds.push(successResponse.body.data.id);

      // Verify the 201 response payload
      expect(successResponse.body.success).toBe(true);
      expect(successResponse.body.data.roomId).toBe(concurrencyRoomId);
      expect(successResponse.body.data.status).toBe('PENDING');

      // Verify the 409 response payload conforms to error standards
      expect(conflictResponse.body.error.code).toBe('ROOM_UNAVAILABLE');
      expect(conflictResponse.body.error.message).toMatch(
        /Room is (not|no longer) available for the selected dates/i
      );

      // Verify PostgreSQL database state: exactly ONE active reservation exists in the DB
      const activeReservationsInDb = await prisma.reservation.findMany({
        where: {
          roomId: concurrencyRoomId,
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          checkInDate: { lt: new Date(dates.checkOutDate) },
          checkOutDate: { gt: new Date(dates.checkInDate) },
        },
      });

      expect(activeReservationsInDb).toHaveLength(1);
      expect(activeReservationsInDb[0].id).toBe(successResponse.body.data.id);
    });
  });
});
