import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PERMISSIONS, ROLES, splitPermission } from '@ehms/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Hotel ────────────────────────────────────────────────────────────────
  const hotel = await prisma.hotel.upsert({
    where: { id: 'seed-hotel-001' },
    update: {},
    create: {
      id: 'seed-hotel-001',
      name: 'Grand HMS Hotel',
      address: '123 Main Street',
      city: 'Addis Ababa',
      country: 'Ethiopia',
      phone: '+251911000000',
      email: 'info@grandhotel.com',
      timezone: 'Africa/Addis_Ababa',
    },
  });
  console.log(`✅ Hotel: ${hotel.name}`);

  // ─── Six SRS Roles ────────────────────────────────────────────────────────
  const srsRoles = [
    {
      name: ROLES.SUPER_ADMIN,
      description: 'Complete system access, tenant management, user lifecycle, and role assignment',
    },
    {
      name: ROLES.HOTEL_MANAGER,
      description: 'Operations oversight, manager overrides, financial approvals, voiding/cancellations, report generation',
    },
    {
      name: ROLES.RECEPTIONIST,
      description: 'Front desk operations, reservation lifecycle, guest profiles, check-in, check-out, and folio posting',
    },
    {
      name: ROLES.HOUSEKEEPER,
      description: 'Housekeeping room rack, task status updates, and maintenance requests',
    },
    {
      name: ROLES.ACCOUNTANT,
      description: 'Full billing and folio access, payment reconciliation, night audit review, and tax/fiscal reporting',
    },
    {
      name: ROLES.GENERAL_STAFF,
      description: 'Restricted operations, POS cashiering, and room service order posting',
    },
  ];

  const roles: Record<string, any> = {};
  for (const r of srsRoles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
    roles[r.name] = role;
  }
  console.log(`✅ Roles: ${srsRoles.map((r) => r.name).join(', ')}`);

  // ─── Permissions ──────────────────────────────────────────────────────────
  const allPermissions: Record<string, any> = {};
  for (const permValue of Object.values(PERMISSIONS)) {
    const { resource, action } = splitPermission(permValue);
    const perm = await prisma.permission.upsert({
      where: { resource_action: { resource, action } },
      update: {},
      create: { resource, action },
    });
    allPermissions[permValue] = perm;
  }
  console.log(`✅ Permissions created (${Object.keys(allPermissions).length} canonical permissions)`);

  // ─── Role → Permission Matrix ─────────────────────────────────────────────
  // Clear any existing role permissions for these roles to ensure a clean, deterministic sync
  await prisma.rolePermission.deleteMany({
    where: {
      roleId: { in: Object.values(roles).map((r) => r.id) },
    },
  });

  // 1. Super Admin: full system access (all permissions)
  for (const perm of Object.values(allPermissions)) {
    await prisma.rolePermission.create({
      data: { roleId: roles[ROLES.SUPER_ADMIN].id, permissionId: perm.id },
    });
  }

  // 2. Hotel Manager: all permissions except users:delete and billing:delete
  const managerPerms = Object.values(PERMISSIONS).filter(
    (p) => p !== PERMISSIONS.USERS_DELETE && p !== PERMISSIONS.BILLING_DELETE
  );
  for (const permKey of managerPerms) {
    const perm = allPermissions[permKey];
    if (!perm) continue;
    await prisma.rolePermission.create({
      data: { roleId: roles[ROLES.HOTEL_MANAGER].id, permissionId: perm.id },
    });
  }

  // 3. Receptionist: guests, reservations, front_desk, rooms/room_types/rates (read), floors/hotels (read), billing (read/create/update)
  const receptionistPerms = [
    PERMISSIONS.GUESTS_READ,
    PERMISSIONS.GUESTS_CREATE,
    PERMISSIONS.GUESTS_UPDATE,
    PERMISSIONS.ROOMS_READ,
    PERMISSIONS.ROOM_TYPES_READ,
    PERMISSIONS.RATE_PLANS_READ,
    PERMISSIONS.FLOORS_READ,
    PERMISSIONS.HOTELS_READ,
    PERMISSIONS.RESERVATIONS_READ,
    PERMISSIONS.RESERVATIONS_CREATE,
    PERMISSIONS.RESERVATIONS_UPDATE,
    PERMISSIONS.FRONT_DESK_READ,
    PERMISSIONS.FRONT_DESK_UPDATE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_UPDATE,
  ];
  for (const permKey of receptionistPerms) {
    const perm = allPermissions[permKey];
    if (!perm) continue;
    await prisma.rolePermission.create({
      data: { roleId: roles[ROLES.RECEPTIONIST].id, permissionId: perm.id },
    });
  }

  // 4. Housekeeper: rooms read/update, housekeeping read/create/update, maintenance read/create/update
  const housekeeperPerms = [
    PERMISSIONS.ROOMS_READ,
    PERMISSIONS.ROOMS_UPDATE,
    PERMISSIONS.HOUSEKEEPING_READ,
    PERMISSIONS.HOUSEKEEPING_CREATE,
    PERMISSIONS.HOUSEKEEPING_UPDATE,
    PERMISSIONS.MAINTENANCE_READ,
    PERMISSIONS.MAINTENANCE_CREATE,
    PERMISSIONS.MAINTENANCE_UPDATE,
  ];
  for (const permKey of housekeeperPerms) {
    const perm = allPermissions[permKey];
    if (!perm) continue;
    await prisma.rolePermission.create({
      data: { roleId: roles[ROLES.HOUSEKEEPER].id, permissionId: perm.id },
    });
  }

  // 5. Accountant: billing read/create/update (NO billing:delete or destructive delete rights), reports read, night audit read/create, reservations/guests read, audit log read
  const accountantPerms = [
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_UPDATE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.NIGHT_AUDIT_READ,
    PERMISSIONS.NIGHT_AUDIT_CREATE,
    PERMISSIONS.RESERVATIONS_READ,
    PERMISSIONS.GUESTS_READ,
    PERMISSIONS.AUDIT_LOG_READ,
  ];
  for (const permKey of accountantPerms) {
    const perm = allPermissions[permKey];
    if (!perm) continue;
    await prisma.rolePermission.create({
      data: { roleId: roles[ROLES.ACCOUNTANT].id, permissionId: perm.id },
    });
  }

  // 6. General Staff: restricted operations (read rooms, room types, post charges/orders)
  const generalStaffPerms = [
    PERMISSIONS.ROOMS_READ,
    PERMISSIONS.ROOM_TYPES_READ,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_CREATE,
  ];
  for (const permKey of generalStaffPerms) {
    const perm = allPermissions[permKey];
    if (!perm) continue;
    await prisma.rolePermission.create({
      data: { roleId: roles[ROLES.GENERAL_STAFF].id, permissionId: perm.id },
    });
  }

  console.log('✅ Role permissions assigned (Accountant delete rights strictly revoked)');

  // ─── Admin User ───────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@1234', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@grandhotel.com' },
    update: {
      roleId: roles[ROLES.SUPER_ADMIN].id,
    },
    create: {
      hotelId: hotel.id,
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@grandhotel.com',
      passwordHash,
      roleId: roles[ROLES.SUPER_ADMIN].id,
    },
  });
  console.log(`✅ Admin user: ${adminUser.email} / Admin@1234 (Role: ${ROLES.SUPER_ADMIN})`);

  // Clean up any legacy roles not in the 6 SRS roles
  try {
    const validRoleNames = srsRoles.map((r) => r.name);
    await prisma.rolePermission.deleteMany({
      where: { role: { name: { notIn: validRoleNames } } },
    });
    await prisma.role.deleteMany({
      where: { name: { notIn: validRoleNames } },
    });
  } catch {
    // Non-fatal if foreign keys prevent deletion
  }

  // ─── Room Types ───────────────────────────────────────────────────────────
  const roomTypes = [
    {
      name: 'Standard Single',
      description: 'Comfortable single room',
      baseRate: 80,
      maxOccupancy: 1,
      amenities: ['WiFi', 'AC', 'TV'],
    },
    {
      name: 'Standard Double',
      description: 'Spacious double room',
      baseRate: 120,
      maxOccupancy: 2,
      amenities: ['WiFi', 'AC', 'TV', 'Mini Fridge'],
    },
    {
      name: 'Deluxe Suite',
      description: 'Luxury suite',
      baseRate: 250,
      maxOccupancy: 3,
      amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Jacuzzi'],
    },
  ];

  const createdRoomTypes: any[] = [];
  for (const rt of roomTypes) {
    const existing = await prisma.roomType.findFirst({
      where: { hotelId: hotel.id, name: rt.name },
    });
    if (!existing) {
      const created = await prisma.roomType.create({
        data: { ...rt, hotelId: hotel.id },
      });
      createdRoomTypes.push(created);
    } else {
      createdRoomTypes.push(existing);
    }
  }
  console.log('✅ Room types seeded');

  // ─── Floors ───────────────────────────────────────────────────────────────
  const floorNumbers = [1, 2, 3];
  const floors: Record<number, any> = {};

  for (const floorNumber of floorNumbers) {
    const existing = await prisma.floor.findUnique({
      where: { hotelId_floorNumber: { hotelId: hotel.id, floorNumber } },
    });
    if (!existing) {
      const fl = await prisma.floor.create({
        data: {
          hotelId: hotel.id,
          floorNumber,
          name: `Floor ${floorNumber}`,
        },
      });
      floors[floorNumber] = fl;
    } else {
      floors[floorNumber] = existing;
    }
  }
  console.log('✅ Floors seeded (3 floors)');

  // ─── Rooms ────────────────────────────────────────────────────────────────
  const roomDefs = [
    { roomNumber: '101', floor: 1, typeIndex: 0 },
    { roomNumber: '102', floor: 1, typeIndex: 0 },
    { roomNumber: '103', floor: 1, typeIndex: 1 },
    { roomNumber: '201', floor: 2, typeIndex: 1 },
    { roomNumber: '202', floor: 2, typeIndex: 1 },
    { roomNumber: '301', floor: 3, typeIndex: 2 },
  ];

  for (const def of roomDefs) {
    const existing = await prisma.room.findFirst({
      where: { hotelId: hotel.id, roomNumber: def.roomNumber },
    });
    if (!existing) {
      await prisma.room.create({
        data: {
          hotelId: hotel.id,
          roomTypeId: createdRoomTypes[def.typeIndex].id,
          floorId: floors[def.floor].id,
          roomNumber: def.roomNumber,
          status: 'AVAILABLE',
        },
      });
    }
  }
  console.log('✅ Rooms seeded (6 rooms)');

  console.log('\n🎉 Seeding complete!');
  console.log('   Login: admin@grandhotel.com / Admin@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
