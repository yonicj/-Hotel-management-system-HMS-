import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';

describe('Hotel Setup Integration Flow (Floors, Room Types, Rooms, Rate Plans)', () => {
  let managerToken: string;
  let testFloorId: string;
  let testRoomTypeId: string;
  let testRoomId: string;
  let testRatePlanId: string;
  const testFloorNumber = Math.floor(100 + Math.random() * 800);
  const testRoomNumber = `${testFloorNumber}01`;

  beforeAll(async () => {
    // 1. Authenticate as Hotel Manager
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'manager@grandhotel.com', password: 'Admin@1234' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    managerToken = loginRes.body.data.accessToken;
    expect(managerToken).toBeDefined();

    // Clean up any previous test residues
    await prisma.room.deleteMany({ where: { roomNumber: { in: ['8801', testRoomNumber] } } });
    await prisma.floor.deleteMany({ where: { floorNumber: { in: [88, testFloorNumber] } } });
  });

  afterAll(async () => {
    if (testRoomId) {
      await prisma.room.deleteMany({ where: { id: testRoomId } });
    }
    if (testRatePlanId) {
      await prisma.ratePlan.deleteMany({ where: { id: testRatePlanId } });
    }
    if (testRoomTypeId) {
      await prisma.roomType.deleteMany({ where: { id: testRoomTypeId } });
    }
    if (testFloorId) {
      await prisma.floor.deleteMany({ where: { id: testFloorId } });
    }
    await prisma.floor.deleteMany({ where: { floorNumber: { in: [88, testFloorNumber] } } });
  });

  it('Step 1: Hotel Manager creates a new floor', async () => {
    const floorRes = await request(app)
      .post('/api/floors')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        floorNumber: testFloorNumber,
        name: 'Panorama Sky Floor',
        description: 'Top-tier floor with skyline views and executive lounge',
      });

    expect(floorRes.status).toBe(201);
    expect(floorRes.body.success).toBe(true);
    expect(floorRes.body.data).toBeDefined();
    expect(floorRes.body.data.floorNumber).toBe(testFloorNumber);
    expect(floorRes.body.data.name).toBe('Panorama Sky Floor');
    testFloorId = floorRes.body.data.id;
  });

  it('Step 2: Hotel Manager creates a new Room Type with ETB base rate and amenities', async () => {
    const roomTypeRes = await request(app)
      .post('/api/room-types')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: 'Presidential Panorama Suite',
        description: 'Luxury multi-room suite with private terrace and butler pantry',
        baseRate: 14500.0,
        maxOccupancy: 4,
        amenities: [
          'High-Speed Wi-Fi',
          'Air Conditioning',
          'Balcony',
          'Mini Bar',
          'Jacuzzi',
          'Butler Service',
        ],
      });

    expect(roomTypeRes.status).toBe(201);
    expect(roomTypeRes.body.success).toBe(true);
    expect(roomTypeRes.body.data).toBeDefined();
    expect(roomTypeRes.body.data.name).toBe('Presidential Panorama Suite');
    expect(Number(roomTypeRes.body.data.baseRate)).toBe(14500.0);
    expect(roomTypeRes.body.data.maxOccupancy).toBe(4);
    testRoomTypeId = roomTypeRes.body.data.id;
  });

  it('Step 3: Hotel Manager provisions a room on the new floor with the new room type', async () => {
    const roomRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        roomNumber: testRoomNumber,
        floorId: testFloorId,
        roomTypeId: testRoomTypeId,
        isSmoking: false,
        notes: 'Master suite with private keycard elevator lock',
      });

    expect(roomRes.status).toBe(201);
    expect(roomRes.body.success).toBe(true);
    expect(roomRes.body.data).toBeDefined();
    expect(roomRes.body.data.roomNumber).toBe(testRoomNumber);
    expect(roomRes.body.data.floorId).toBe(testFloorId);
    expect(roomRes.body.data.roomTypeId).toBe(testRoomTypeId);
    expect(roomRes.body.data.status).toBe('AVAILABLE');
    testRoomId = roomRes.body.data.id;
  });

  it('Step 4: Hotel Manager creates and attaches a promotional Rate Plan to the room type', async () => {
    const ratePlanRes = await request(app)
      .post('/api/rate-plans')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        roomTypeId: testRoomTypeId,
        name: 'Addis International Summit Promotional Rate',
        rate: 11800.0,
        startDate: '2026-11-01',
        endDate: '2026-11-20',
        minStay: 2,
        isActive: true,
      });

    expect(ratePlanRes.status).toBe(201);
    expect(ratePlanRes.body.success).toBe(true);
    expect(ratePlanRes.body.data).toBeDefined();
    expect(ratePlanRes.body.data.name).toBe('Addis International Summit Promotional Rate');
    expect(Number(ratePlanRes.body.data.rate)).toBe(11800.0);
    expect(ratePlanRes.body.data.isActive).toBe(true);
    testRatePlanId = ratePlanRes.body.data.id;
  });

  it('Step 5: Computes pricing during the rate plan window and verifies override rate is applied', async () => {
    const computeRes = await request(app)
      .get('/api/rate-plans/compute')
      .set('Authorization', `Bearer ${managerToken}`)
      .query({
        room_type_id: testRoomTypeId,
        check_in: '2026-11-05',
        check_out: '2026-11-08',
      });

    expect(computeRes.status).toBe(200);
    expect(computeRes.body.success).toBe(true);
    const data = computeRes.body.data;
    expect(data.nights).toBe(3);
    expect(Number(data.ratePerNight)).toBe(11800.0);
    expect(Number(data.totalAmount)).toBe(35400.0); // 3 * 11800
    expect(data.ratePlan).toBeDefined();
    expect(data.ratePlan.id).toBe(testRatePlanId);
  });

  it('Step 6: Toggles Rate Plan to inactive and verifies pricing falls back to standard base rate', async () => {
    // 1. Toggle isActive: false
    const toggleRes = await request(app)
      .put(`/api/rate-plans/${testRatePlanId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ isActive: false });

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.data.isActive).toBe(false);

    // 2. Re-compute rate: should now use baseRate (14500)
    const computeRes = await request(app)
      .get('/api/rate-plans/compute')
      .set('Authorization', `Bearer ${managerToken}`)
      .query({
        room_type_id: testRoomTypeId,
        check_in: '2026-11-05',
        check_out: '2026-11-08',
      });

    expect(computeRes.status).toBe(200);
    expect(Number(computeRes.body.data.ratePerNight)).toBe(14500.0);
    expect(Number(computeRes.body.data.totalAmount)).toBe(43500.0); // 3 * 14500
    expect(computeRes.body.data.ratePlan).toBeNull();
  });

  it('Step 7: Updates Room 8801 status through maintenance and ready lifecycle', async () => {
    // Transition to MAINTENANCE
    const maintRes = await request(app)
      .put(`/api/rooms/${testRoomId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        status: 'MAINTENANCE',
        notes: 'Panoramic balcony rail inspection and glass cleaning',
      });

    expect(maintRes.status).toBe(200);
    expect(maintRes.body.data.status).toBe('MAINTENANCE');

    // Transition back to AVAILABLE
    const availRes = await request(app)
      .put(`/api/rooms/${testRoomId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        status: 'AVAILABLE',
        notes: 'Inspection cleared by chief engineer; suite ready for guest check-in',
      });

    expect(availRes.status).toBe(200);
    expect(availRes.body.data.status).toBe('AVAILABLE');
  });

  it('Step 8: Prevents duplicate room numbers with conflict error', async () => {
    const dupRes = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        roomNumber: testRoomNumber, // Already exists on this hotel
        floorId: testFloorId,
        roomTypeId: testRoomTypeId,
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.error).toBeDefined();
  });

  it('Step 9: Validates input schemas and rejects invalid rate plan parameters', async () => {
    const invalidRes = await request(app)
      .post('/api/rate-plans')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        roomTypeId: testRoomTypeId,
        name: 'Invalid Negative Rate',
        rate: -500, // Invalid: must be positive
        startDate: 'invalid-date-format',
        endDate: '2026-12-31',
      });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error).toBeDefined();
  });
});
