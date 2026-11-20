import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { redis } from '../../src/config/redis';
import { ROLES, Role } from '@ehms/config';
import { ErrorCode } from '@ehms/types';

describe('Phase 2 Integration Test Matrix: Authentication, Token Revocation & 6x11 RBAC', () => {
  const TEST_PASSWORD = 'TestPassword123!';
  let hotelId: string;
  let testFolioId: string;
  const tokens: Record<string, string> = {};
  const userRecords: Record<string, any> = {};

  const SRS_ROLES: Role[] = [
    ROLES.SUPER_ADMIN,
    ROLES.HOTEL_MANAGER,
    ROLES.RECEPTIONIST,
    ROLES.HOUSEKEEPER,
    ROLES.ACCOUNTANT,
    ROLES.GENERAL_STAFF,
  ];

  beforeAll(async () => {
    // 1. Get or create test Hotel
    let hotel = await prisma.hotel.findFirst();
    if (!hotel) {
      hotel = await prisma.hotel.create({
        data: {
          id: 'test-matrix-hotel-001',
          name: 'Grand Test Hotel',
          address: '456 Test Ave',
          city: 'Addis Ababa',
          country: 'Ethiopia',
          phone: '+251911111111',
          email: 'test@grandhotel.com',
          timezone: 'Africa/Addis_Ababa',
        },
      });
    }
    hotelId = hotel.id;

    // 2. Ensure test RoomType, Room, RatePlan, Guest, Reservation, Folio exist for route tests
    let roomType = await prisma.roomType.findFirst({ where: { hotelId } });
    if (!roomType) {
      roomType = await prisma.roomType.create({
        data: {
          hotelId,
          name: 'Standard Suite',
          baseRate: 100,
          maxOccupancy: 2,
        },
      });
    }

    let room = await prisma.room.findFirst({ where: { hotelId } });
    if (!room) {
      let floor = await prisma.floor.findFirst({ where: { hotelId } });
      if (!floor) {
        floor = await prisma.floor.create({
          data: { hotelId, floorNumber: 1, name: 'Floor 1' },
        });
      }
      room = await prisma.room.create({
        data: {
          hotelId,
          roomTypeId: roomType.id,
          floorId: floor.id,
          roomNumber: 'T-101',
          status: 'AVAILABLE',
        },
      });
    }

    let ratePlan = await prisma.ratePlan.findFirst({ where: { hotelId } });
    if (!ratePlan) {
      ratePlan = await prisma.ratePlan.create({
        data: {
          hotelId,
          roomTypeId: roomType.id,
          name: 'Standard Rate',
          rate: 100,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2028-12-31'),
        },
      });
    }

    let guest = await prisma.guest.findFirst();
    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          firstName: 'John',
          lastName: 'Tester',
          email: 'johntester@example.com',
          phone: '+251912345678',
        },
      });
    }

    const firstUser = await prisma.user.findFirst();
    let reservation = await prisma.reservation.findFirst({ where: { hotelId } });
    if (!reservation && firstUser) {
      reservation = await prisma.reservation.create({
        data: {
          hotelId,
          roomTypeId: roomType.id,
          roomId: room.id,
          ratePlanId: ratePlan.id,
          confirmationNumber: 'CONF-TEST-999',
          checkInDate: new Date('2027-01-01'),
          checkOutDate: new Date('2027-01-05'),
          status: 'CONFIRMED',
          totalAmount: 400,
          createdBy: firstUser.id,
        },
      });
      await prisma.reservationGuest.create({
        data: {
          reservationId: reservation.id,
          guestId: guest.id,
          isPrimary: true,
        },
      });
    }

    let folio = await prisma.folio.findFirst();
    if (!folio && reservation) {
      folio = await prisma.folio.create({
        data: {
          reservationId: reservation.id,
          folioNumber: `FOL-TEST-999`,
          status: 'OPEN',
        },
      });
    }
    testFolioId = folio ? folio.id : 'fallback-folio-id';

    // 3. Upsert test users for all 6 SRS roles
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

    for (const roleName of SRS_ROLES) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) {
        throw new Error(`Required SRS role "${roleName}" is missing in the database. Run seed first!`);
      }

      const emailSlug = roleName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `test-${emailSlug}@hms-matrix.com`;

      const user = await prisma.user.upsert({
        where: { email },
        update: { roleId: role.id, isActive: true },
        create: {
          hotelId,
          roleId: role.id,
          firstName: 'Test',
          lastName: roleName,
          email,
          passwordHash,
          isActive: true,
        },
        include: { role: true },
      });

      userRecords[roleName] = user;

      // 4. Authenticate each role via POST /api/auth/login and cache access tokens
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: TEST_PASSWORD });

      if (loginRes.status !== 200 || !loginRes.body?.data?.accessToken) {
        throw new Error(`Login failed for role "${roleName}": ${JSON.stringify(loginRes.body)}`);
      }

      tokens[roleName] = loginRes.body.data.accessToken;
    }
  }, 30000);

  afterAll(async () => {
    await prisma.$disconnect();
    try {
      redis.disconnect();
    } catch {
      // ignore
    }
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PART 1: Authentication & Token Revocation
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Part 1: Authentication, Token Refresh & Token Revocation', () => {
    it('POST /api/auth/login returns access & refresh tokens and writes LOGIN_SUCCESS to AuditLog', async () => {
      const email = userRecords[ROLES.RECEPTIONIST].email;
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: TEST_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.user.role).toBe(ROLES.RECEPTIONIST);

      // Verify AuditLog row was written
      const auditEntry = await prisma.auditLog.findFirst({
        where: {
          userId: userRecords[ROLES.RECEPTIONIST].id,
          action: 'LOGIN_SUCCESS',
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditEntry).not.toBeNull();
      expect(auditEntry?.action).toBe('LOGIN_SUCCESS');
      expect(auditEntry?.entityType).toBe('User');
    });

    it('POST /api/auth/refresh issues a new valid access token and rotates refresh token', async () => {
      const email = userRecords[ROLES.ACCOUNTANT].email;
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: TEST_PASSWORD });

      const oldRefreshToken = loginRes.body.data.refreshToken;

      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).not.toBe(oldRefreshToken);

      // Verify the new access token can make authenticated requests
      const testReq = await request(app)
        .get('/api/billing/' + testFolioId)
        .set('Authorization', `Bearer ${refreshRes.body.data.accessToken}`);

      expect(testReq.status).toBe(200);
    });

    it('POST /api/auth/logout revokes access & refresh tokens; subsequent calls fail with 401 UNAUTHORIZED', async () => {
      const email = userRecords[ROLES.HOUSEKEEPER].email;
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: TEST_PASSWORD });

      const activeAccessToken = loginRes.body.data.accessToken;
      const activeRefreshToken = loginRes.body.data.refreshToken;

      // Prove the token works prior to logout
      const beforeLogout = await request(app)
        .get('/api/housekeeping/board')
        .set('Authorization', `Bearer ${activeAccessToken}`);
      expect(beforeLogout.status).toBe(200);

      // Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${activeAccessToken}`)
        .send({ refreshToken: activeRefreshToken });

      expect(logoutRes.status).toBe(200);

      // Subsequent request with the revoked access token must be rejected with 401 UNAUTHORIZED
      const afterLogout = await request(app)
        .get('/api/housekeeping/board')
        .set('Authorization', `Bearer ${activeAccessToken}`);

      expect(afterLogout.status).toBe(401);
      expect(afterLogout.body.error).toBeDefined();
      expect(afterLogout.body.error.code).toBe(ErrorCode.UNAUTHORIZED);

      // Subsequent refresh with the revoked refresh token must be rejected with 401 UNAUTHORIZED
      const refreshAfterLogout = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: activeRefreshToken });

      expect(refreshAfterLogout.status).toBe(401);
      expect(refreshAfterLogout.body.error).toBeDefined();
      expect(refreshAfterLogout.body.error.code).toBe(ErrorCode.UNAUTHORIZED);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PART 2: 6 Roles x 11 Route Groups RBAC Matrix
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Part 2: 6x11 RBAC Role-by-Route Matrix', () => {
    interface RouteCheck {
      group: string;
      endpoint: () => string;
      expected: Record<Role, 200 | 403>;
    }

    const routeChecks: RouteCheck[] = [
      {
        group: 'users',
        endpoint: () => '/api/users',
        expected: {
          [ROLES.SUPER_ADMIN]: 200,
          [ROLES.HOTEL_MANAGER]: 200,
          [ROLES.RECEPTIONIST]: 403,
          [ROLES.HOUSEKEEPER]: 403,
          [ROLES.ACCOUNTANT]: 403,
          [ROLES.GENERAL_STAFF]: 403,
        },
      },
      {
        group: 'rooms',
        endpoint: () => '/api/rooms',
        expected: {
          [ROLES.SUPER_ADMIN]: 200,
          [ROLES.HOTEL_MANAGER]: 200,
          [ROLES.RECEPTIONIST]: 200,
          [ROLES.HOUSEKEEPER]: 200,
          [ROLES.ACCOUNTANT]: 403,
          [ROLES.GENERAL_STAFF]: 200,
        },
      },
      {
        group: 'room-types',
        endpoint: () => '/api/room-types',
        expected: {
          [ROLES.SUPER_ADMIN]: 200,
          [ROLES.HOTEL_MANAGER]: 200,
          [ROLES.RECEPTIONIST]: 200,
          [ROLES.HOUSEKEEPER]: 403,
          [ROLES.ACCOUNTANT]: 403,
          [ROLES.GENERAL_STAFF]: 200,
        },
      },
      {
        group: 'rate-plans',
        endpoint: () => '/api/rate-plans',
        expected: {
          [ROLES.SUPER_ADMIN]: 200,
          [ROLES.HOTEL_MANAGER]: 200,
          [ROLES.RECEPTIONIST]: 200,
          [ROLES.HOUSEKEEPER]: 403,
          [ROLES.ACCOUNTANT]: 403,
          [ROLES.GENERAL_STAFF]: 403,
        },
      },
      {
        group: 'guests',
        endpoint: () => '/api/guests',
        expected: {
          [ROLES.SUPER_ADMIN]: 200,
          [ROLES.HOTEL_MANAGER]: 200,
          [ROLES.RECEPTIONIST]: 200,
          [ROLES.HOUSEKEEPER]: 403,
          [ROLES.ACCOUNTANT]: 200,
          [ROLES.GENERAL_STAFF]: 403,
        },
      },
      {
        group: 'reservations',
        endpoint: () => '/api/reservations',
        expected: {
          [ROLES.SUPER_ADMIN]: 200,
          [ROLES.HOTEL_MANAGER]: 200,
          [ROLES.RECEPTIONIST]: 200,
          [ROLES.HOUSEKEEPER]: 403,
          [ROLES.ACCOUNTANT]: 200,
          [ROLES.GENERAL_STAFF]: 403,
        },
      },
      {
        group: 'front-desk',
        endpoint: () => '/api/front-desk/room-rack',
        expected: {
          [ROLES.SUPER_ADMIN]: 200,
          [ROLES.HOTEL_MANAGER]: 200,
          [ROLES.RECEPTIONIST]: 200,
          [ROLES.HOUSEKEEPER]: 403,
          [ROLES.ACCOUNTANT]: 403,
          [ROLES.GENERAL_STAFF]: 403,
        },
      },
      {
        group: 'billing',
        endpoint: () => `/api/billing/${testFolioId}`,
        expected: {
          [ROLES.SUPER_ADMIN]: 200,
          [ROLES.HOTEL_MANAGER]: 200,
          [ROLES.RECEPTIONIST]: 200,
          [ROLES.HOUSEKEEPER]: 403,
          [ROLES.ACCOUNTANT]: 200,
          [ROLES.GENERAL_STAFF]: 200,
        },
      },
      {
        group: 'housekeeping',
        endpoint: () => '/api/housekeeping/board',
        expected: {
          [ROLES.SUPER_ADMIN]: 200,
          [ROLES.HOTEL_MANAGER]: 200,
          [ROLES.RECEPTIONIST]: 403,
          [ROLES.HOUSEKEEPER]: 200,
          [ROLES.ACCOUNTANT]: 403,
          [ROLES.GENERAL_STAFF]: 403,
        },
      },
      {
        group: 'night-audit',
        endpoint: () => '/api/night-audit/status',
        expected: {
          [ROLES.SUPER_ADMIN]: 200,
          [ROLES.HOTEL_MANAGER]: 200,
          [ROLES.RECEPTIONIST]: 403,
          [ROLES.HOUSEKEEPER]: 403,
          [ROLES.ACCOUNTANT]: 200,
          [ROLES.GENERAL_STAFF]: 403,
        },
      },
      {
        group: 'reports',
        endpoint: () => '/api/reports/occupancy',
        expected: {
          [ROLES.SUPER_ADMIN]: 200,
          [ROLES.HOTEL_MANAGER]: 200,
          [ROLES.RECEPTIONIST]: 403,
          [ROLES.HOUSEKEEPER]: 403,
          [ROLES.ACCOUNTANT]: 200,
          [ROLES.GENERAL_STAFF]: 403,
        },
      },
    ];

    const matrixResults: {
      route: string;
      role: string;
      status: number;
      outcome: 'ALLOWED' | 'FORBIDDEN';
      passed: boolean;
    }[] = [];

    for (const check of routeChecks) {
      describe(`Route Group: /api/${check.group}`, () => {
        for (const role of SRS_ROLES) {
          const expectedStatus = check.expected[role];

          it(`${role} -> ${expectedStatus === 200 ? '200 ALLOWED' : '403 FORBIDDEN'}`, async () => {
            const token = tokens[role];
            const url = check.endpoint();

            const res = await request(app)
              .get(url)
              .set('Authorization', `Bearer ${token}`);

            matrixResults.push({
              route: check.group,
              role,
              status: res.status,
              outcome: res.status === 200 ? 'ALLOWED' : 'FORBIDDEN',
              passed: res.status === expectedStatus,
            });

            expect(res.status).toBe(expectedStatus);

            if (expectedStatus === 403) {
              expect(res.body.error).toBeDefined();
              expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
            } else {
              expect(res.status).toBe(200);
            }
          });
        }
      });
    }

    it('Prints complete 6x11 RBAC matrix summary table', () => {
      console.log('\n═══════════════════════════════════════════════════════════════════════════════');
      console.log('             PHASE 2: 6x11 ROLE-BY-ROUTE RBAC ACCESS MATRIX');
      console.log('═══════════════════════════════════════════════════════════════════════════════');
      console.log(
        'Route Group'.padEnd(16) +
          SRS_ROLES.map((r) => r.padEnd(16)).join('')
      );
      console.log('─'.repeat(16 + SRS_ROLES.length * 16));

      for (const check of routeChecks) {
        let row = check.group.padEnd(16);
        for (const role of SRS_ROLES) {
          const expected = check.expected[role];
          const label = expected === 200 ? '✅ 200 OK' : '⛔ 403 FORBID';
          row += label.padEnd(16);
        }
        console.log(row);
      }
      console.log('═══════════════════════════════════════════════════════════════════════════════\n');

      expect(matrixResults.every((r) => r.passed)).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // PART 3: Financial Immutability & Revoked Accountant Delete Rights
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Part 3: Financial Immutability & Revoked Accountant Delete Rights', () => {
    it('Accountant is strictly blocked from deleting financial records (returns 403 FORBIDDEN)', async () => {
      const accountantToken = tokens[ROLES.ACCOUNTANT];
      const res = await request(app)
        .delete(`/api/billing/${testFolioId}/charges/dummy-charge-id`)
        .set('Authorization', `Bearer ${accountantToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
      expect(res.body.error.message).toContain('billing:delete');
    });

    it('Other non-admin roles (Receptionist, Housekeeper, Staff) are also blocked from financial deletion', async () => {
      for (const role of [ROLES.RECEPTIONIST, ROLES.HOUSEKEEPER, ROLES.GENERAL_STAFF]) {
        const res = await request(app)
          .delete(`/api/billing/${testFolioId}/charges/dummy-charge-id`)
          .set('Authorization', `Bearer ${tokens[role]}`);

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe(ErrorCode.FORBIDDEN);
      }
    });
  });
});
