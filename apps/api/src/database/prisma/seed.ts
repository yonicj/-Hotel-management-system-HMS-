import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  // ─── Roles ────────────────────────────────────────────────────────────────
  const roleNames = ['admin', 'manager', 'receptionist', 'housekeeping', 'accountant'];
  const roles: Record<string, any> = {};

  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} role` },
    });
    roles[name] = role;
  }
  console.log(`✅ Roles: ${roleNames.join(', ')}`);

  // ─── Permissions ──────────────────────────────────────────────────────────
  const resources = [
    'users', 'guests', 'rooms', 'room_types', 'rate_plans',
    'reservations', 'front_desk', 'housekeeping', 'billing',
    'night_audit', 'reports',
  ];
  const actions = ['create', 'read', 'update', 'delete'];

  // Create all permissions
  const allPermissions: Record<string, any> = {};
  for (const resource of resources) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action },
      });
      allPermissions[`${resource}:${action}`] = perm;
    }
  }
  console.log('✅ Permissions created');

  // ─── Role → Permission Matrix ─────────────────────────────────────────────
  // Admin gets everything
  for (const perm of Object.values(allPermissions)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.admin.id, permissionId: perm.id } },
      update: {},
      create: { roleId: roles.admin.id, permissionId: perm.id },
    });
  }

  // Manager: all except users:delete
  const managerPerms = Object.entries(allPermissions)
    .filter(([key]) => key !== 'users:delete')
    .map(([, v]) => v);
  for (const perm of managerPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.manager.id, permissionId: perm.id } },
      update: {},
      create: { roleId: roles.manager.id, permissionId: perm.id },
    });
  }

  // Receptionist: guests, reservations, front_desk, billing (read/create/update)
  const receptionistKeys = [
    'guests:read', 'guests:create', 'guests:update',
    'rooms:read',
    'room_types:read',
    'rate_plans:read',
    'reservations:read', 'reservations:create', 'reservations:update',
    'front_desk:read', 'front_desk:update',
    'billing:read', 'billing:create', 'billing:update',
  ];
  for (const key of receptionistKeys) {
    const perm = allPermissions[key];
    if (!perm) continue;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.receptionist.id, permissionId: perm.id } },
      update: {},
      create: { roleId: roles.receptionist.id, permissionId: perm.id },
    });
  }

  // Housekeeping: rooms read/update, housekeeping all
  const housekeepingKeys = [
    'rooms:read', 'rooms:update',
    'housekeeping:read', 'housekeeping:create', 'housekeeping:update',
  ];
  for (const key of housekeepingKeys) {
    const perm = allPermissions[key];
    if (!perm) continue;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.housekeeping.id, permissionId: perm.id } },
      update: {},
      create: { roleId: roles.housekeeping.id, permissionId: perm.id },
    });
  }

  // Accountant: billing all, reports read, night_audit all
  const accountantKeys = [
    'billing:read', 'billing:create', 'billing:update', 'billing:delete',
    'reports:read',
    'night_audit:read', 'night_audit:create',
  ];
  for (const key of accountantKeys) {
    const perm = allPermissions[key];
    if (!perm) continue;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.accountant.id, permissionId: perm.id } },
      update: {},
      create: { roleId: roles.accountant.id, permissionId: perm.id },
    });
  }
  console.log('✅ Role permissions assigned');

  // ─── Admin User ───────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@1234', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@grandhotel.com' },
    update: {},
    create: {
      hotelId: hotel.id,
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@grandhotel.com',
      passwordHash,
      roleId: roles.admin.id,
    },
  });
  console.log(`✅ Admin user: ${adminUser.email} / Admin@1234`);

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
          roomNumber: def.roomNumber,
          floor: def.floor,
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
