import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';

describe('Phase 4: Availability Search & Transactional Double-Booking Prevention', () => {
  let adminToken: string;
  let receptionistToken: string;
  let hotelId: string;
  let singleRoomTypeId: string;
  let testRoomAId: string;
  let testRoomBId: string;
  let maintenanceRoomId: string;
  let outOfServiceRoomId: string;
  let testGuestId: string;
  let testFloorId: string;

  const testSuffix = Date.now().toString().slice(-6);
  const createdReservationIds: string[] = [];
  const createdRoomIds: string[] = [];

  beforeAll(async () => {
    // 1. Authenticate as Admin and Receptionist
    const [adminLogin, recLogin] = await Promise.all([
      request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@grandhotel.com', password: 'Admin@1234' }),
      request(app)
        .post('/api/auth/login')
        .send({ email: 'receptionist@grandhotel.com', password: 'Admin@1234' }),
    ]);

    expect(adminLogin.status).toBe(200);
    expect(recLogin.status).toBe(200);
    adminToken = adminLogin.body.data.accessToken;
    receptionistToken = recLogin.body.data.accessToken;

    const hotel = await prisma.hotel.findFirst();
    const roomType = await prisma.roomType.findFirst({ where: { name: 'Standard Single' } });
    const floor = await prisma.floor.findFirst({ where: { hotelId: hotel!.id } });

    if (!hotel || !roomType || !floor) {
      throw new Error('Database is not seeded properly');
    }

    hotelId = hotel.id;
    singleRoomTypeId = roomType.id;
    testFloorId = floor.id;

    // 2. Create a test guest
    const guest = await prisma.guest.create({
      data: {
        firstName: 'Abebe',
        lastName: `Bikila-${testSuffix}`,
        phone: `+251922${testSuffix}`,
        email: `abebe.${testSuffix}@runner.et`,
        idType: 'PASSPORT',
        idNumber: `P${testSuffix}`,
      },
    });
    testGuestId = guest.id;

    // 3. Create dedicated test rooms
    // Room A (AVAILABLE)
    const roomA = await prisma.room.create({
      data: {
        hotelId,
        roomTypeId: singleRoomTypeId,
        floorId: testFloorId,
        roomNumber: `901-${testSuffix}`,
        status: 'AVAILABLE',
      },
    });
    testRoomAId = roomA.id;
    createdRoomIds.push(roomA.id);

    // Room B (AVAILABLE)
    const roomB = await prisma.room.create({
      data: {
        hotelId,
        roomTypeId: singleRoomTypeId,
        floorId: testFloorId,
        roomNumber: `902-${testSuffix}`,
        status: 'AVAILABLE',
      },
    });
    testRoomBId = roomB.id;
    createdRoomIds.push(roomB.id);

    // Room C (MAINTENANCE)
    const roomM = await prisma.room.create({
      data: {
        hotelId,
        roomTypeId: singleRoomTypeId,
        floorId: testFloorId,
        roomNumber: `903-${testSuffix}`,
        status: 'MAINTENANCE',
      },
    });
    maintenanceRoomId = roomM.id;
    createdRoomIds.push(roomM.id);

    // Room D (OUT_OF_SERVICE)
    const roomOOS = await prisma.room.create({
      data: {
        hotelId,
        roomTypeId: singleRoomTypeId,
        floorId: testFloorId,
        roomNumber: `904-${testSuffix}`,
        status: 'OUT_OF_SERVICE',
      },
    });
    outOfServiceRoomId = roomOOS.id;
    createdRoomIds.push(roomOOS.id);
  });

  afterAll(async () => {
    // Cleanup reservations, folios, rooms, guest
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

    if (testGuestId) {
      await prisma.guest.deleteMany({ where: { id: testGuestId } });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PART 1: Date-Range Availability Search (GET /api/rooms/availability)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Part 1: Date-Range Availability Search', () => {
    it('should reject requests without checkInDate or checkOutDate with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/rooms/availability')
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject checkOutDate <= checkInDate with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/rooms/availability')
        .query({ checkInDate: '2026-12-10', checkOutDate: '2026-12-05' })
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should filter out rooms in MAINTENANCE and OUT_OF_SERVICE status', async () => {
      const res = await request(app)
        .get('/api/rooms/availability')
        .query({
          checkInDate: '2026-12-01',
          checkOutDate: '2026-12-05',
          roomTypeId: singleRoomTypeId,
        })
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const roomIds = res.body.data.map((r: any) => r.id);
      expect(roomIds).toContain(testRoomAId);
      expect(roomIds).toContain(testRoomBId);
      expect(roomIds).not.toContain(maintenanceRoomId);
      expect(roomIds).not.toContain(outOfServiceRoomId);
    });

    it('should exclude rooms with overlapping active reservations', async () => {
      // 1. Create a reservation on Room A from 2026-12-10 to 2026-12-15
      const createRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          guestId: testGuestId,
          roomTypeId: singleRoomTypeId,
          roomId: testRoomAId,
          checkInDate: '2026-12-10',
          checkOutDate: '2026-12-15',
          adults: 1,
        });

      expect(createRes.status).toBe(201);
      createdReservationIds.push(createRes.body.data.id);

      // 2. Search availability overlapping with 2026-12-12 to 2026-12-14
      const availRes = await request(app)
        .get('/api/rooms/availability')
        .query({
          checkInDate: '2026-12-12',
          checkOutDate: '2026-12-14',
          roomTypeId: singleRoomTypeId,
        })
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(availRes.status).toBe(200);
      const roomIds = availRes.body.data.map((r: any) => r.id);
      expect(roomIds).not.toContain(testRoomAId); // Overlapped -> Excluded!
      expect(roomIds).toContain(testRoomBId);     // No overlap -> Included!

      // 3. Search availability for back-to-back dates (2026-12-15 to 2026-12-20) -> Room A should be AVAILABLE
      const b2bAvail = await request(app)
        .get('/api/rooms/availability')
        .query({
          checkInDate: '2026-12-15',
          checkOutDate: '2026-12-20',
          roomTypeId: singleRoomTypeId,
        })
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(b2bAvail.status).toBe(200);
      const b2bRoomIds = b2bAvail.body.data.map((r: any) => r.id);
      expect(b2bRoomIds).toContain(testRoomAId);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PART 2: Transactional Double-Booking Prevention in createReservation
  // ───────────────────────────────────────────────────────────────────────────
  describe('Part 2: Transactional Double-Booking Prevention', () => {
    it('should reject booking a room in MAINTENANCE status with 409 ROOM_UNAVAILABLE', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          guestId: testGuestId,
          roomTypeId: singleRoomTypeId,
          roomId: maintenanceRoomId,
          checkInDate: '2026-12-20',
          checkOutDate: '2026-12-25',
          adults: 1,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ROOM_UNAVAILABLE');
    });

    it('should reject booking a room in OUT_OF_SERVICE status with 409 ROOM_UNAVAILABLE', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          guestId: testGuestId,
          roomTypeId: singleRoomTypeId,
          roomId: outOfServiceRoomId,
          checkInDate: '2026-12-20',
          checkOutDate: '2026-12-25',
          adults: 1,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ROOM_UNAVAILABLE');
    });

    it('should reject booking a room that is already booked for overlapping dates with 409 ROOM_UNAVAILABLE', async () => {
      // Room A is booked 2026-12-10 to 2026-12-15.
      // Attempt to book Room A from 2026-12-11 to 2026-12-13.
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          guestId: testGuestId,
          roomTypeId: singleRoomTypeId,
          roomId: testRoomAId,
          checkInDate: '2026-12-11',
          checkOutDate: '2026-12-13',
          adults: 1,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ROOM_UNAVAILABLE');
      expect(res.body.error.message).toContain('Room is no longer available');
    });

    it('should allow booking the same room for contiguous non-overlapping dates', async () => {
      // Book Room A from 2026-12-15 to 2026-12-18
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          guestId: testGuestId,
          roomTypeId: singleRoomTypeId,
          roomId: testRoomAId,
          checkInDate: '2026-12-15',
          checkOutDate: '2026-12-18',
          adults: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      createdReservationIds.push(res.body.data.id);
    });

    it('should create an audit log entry on reservation creation', async () => {
      const lastResId = createdReservationIds[createdReservationIds.length - 1];
      const auditEntry = await prisma.auditLog.findFirst({
        where: { entityId: lastResId, action: 'RESERVATION_CREATED' },
      });

      expect(auditEntry).not.toBeNull();
      expect(auditEntry?.action).toBe('RESERVATION_CREATED');
      expect(auditEntry?.changes).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // PART 3: Modify & Cancel Endpoints (PATCH & POST /cancel)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Part 3: Modify & Cancel Endpoints', () => {
    let modifiableResId: string;

    beforeAll(async () => {
      // Create a clean reservation on Room B: 2026-12-01 to 2026-12-04
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          guestId: testGuestId,
          roomTypeId: singleRoomTypeId,
          roomId: testRoomBId,
          checkInDate: '2026-12-01',
          checkOutDate: '2026-12-04',
          adults: 1,
        });

      expect(res.status).toBe(201);
      modifiableResId = res.body.data.id;
      createdReservationIds.push(modifiableResId);
    });

    it('should modify reservation dates and recalculate totalAmount with Decimal arithmetic', async () => {
      // Original: 3 nights (Dec 1 to Dec 4)
      const original = await prisma.reservation.findUnique({ where: { id: modifiableResId } });
      const originalAmount = original!.totalAmount;

      // Extend to 5 nights: 2026-12-01 to 2026-12-06
      const res = await request(app)
        .patch(`/api/reservations/${modifiableResId}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          checkOutDate: '2026-12-06',
          specialRequests: 'Late arrival requested',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const updated = res.body.data;
      expect(new Date(updated.checkOutDate).toISOString().split('T')[0]).toBe('2026-12-06');
      expect(updated.specialRequests).toBe('Late arrival requested');

      // Amount for 5 nights must be greater than 3 nights
      expect(Number(updated.totalAmount)).toBeGreaterThan(Number(originalAmount));

      // Verify audit log
      const audit = await prisma.auditLog.findFirst({
        where: { entityId: modifiableResId, action: 'RESERVATION_UPDATED' },
        orderBy: { createdAt: 'desc' },
      });
      expect(audit).not.toBeNull();
    });

    it('should reject modifying dates to overlap with another reservation on the same room with 409', async () => {
      // Room A is booked 2026-12-10 to 2026-12-15.
      // Attempt to move Room B reservation into Room A for those dates.
      const res = await request(app)
        .patch(`/api/reservations/${modifiableResId}`)
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          roomId: testRoomAId,
          checkInDate: '2026-12-11',
          checkOutDate: '2026-12-14',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ROOM_UNAVAILABLE');
    });

    it('should enforce state transitions: PENDING -> CONFIRMED', async () => {
      const res = await request(app)
        .patch(`/api/reservations/${modifiableResId}/confirm`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CONFIRMED');

      const audit = await prisma.auditLog.findFirst({
        where: { entityId: modifiableResId, action: 'RESERVATION_CONFIRMED' },
        orderBy: { createdAt: 'desc' },
      });
      expect(audit).not.toBeNull();
    });

    it('should cancel reservation via POST /api/reservations/:id/cancel and release room immediately', async () => {
      const res = await request(app)
        .post(`/api/reservations/${modifiableResId}/cancel`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');

      // Room B should now be completely available again for 2026-12-01 to 2026-12-06
      const avail = await request(app)
        .get('/api/rooms/availability')
        .query({
          checkInDate: '2026-12-01',
          checkOutDate: '2026-12-06',
          roomTypeId: singleRoomTypeId,
        })
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(avail.status).toBe(200);
      const roomIds = avail.body.data.map((r: any) => r.id);
      expect(roomIds).toContain(testRoomBId);

      // Audit log check
      const audit = await prisma.auditLog.findFirst({
        where: { entityId: modifiableResId, action: 'RESERVATION_CANCELLED' },
        orderBy: { createdAt: 'desc' },
      });
      expect(audit).not.toBeNull();
    });

    it('should reject cancelling an already cancelled reservation with 400', async () => {
      const res = await request(app)
        .post(`/api/reservations/${modifiableResId}/cancel`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('should block cancellation of CHECKED_IN or COMPLETED reservations with 400', async () => {
      // Create a reservation, check in, and attempt cancellation
      const newRes = await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${receptionistToken}`)
        .send({
          guestId: testGuestId,
          roomTypeId: singleRoomTypeId,
          roomId: testRoomBId,
          checkInDate: '2026-12-26',
          checkOutDate: '2026-12-28',
          adults: 1,
        });

      expect(newRes.status).toBe(201);
      const resId = newRes.body.data.id;
      createdReservationIds.push(resId);

      // Check-in via front desk
      const checkInRes = await request(app)
        .post(`/api/front-desk/check-in/${resId}`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(checkInRes.status).toBe(200);

      // Attempt to cancel checked-in reservation
      const cancelRes = await request(app)
        .post(`/api/reservations/${resId}/cancel`)
        .set('Authorization', `Bearer ${receptionistToken}`);

      expect(cancelRes.status).toBe(400);
      expect(cancelRes.body.error.code).toBe('BAD_REQUEST');
      expect(cancelRes.body.error.message).toContain('Cannot cancel an active or completed reservation');
    });
  });
});
