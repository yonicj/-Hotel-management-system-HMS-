import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Create Hotel ──────────────────────────────────────────────────────────
  const hotel = await prisma.hotel.upsert({
    where: { id: 'seed-hotel-001' },
    update: {},
    create: {
      id: 'seed-hotel-001',
      name: 'Grand HMS Hotel',
      address: '123 Main Street',
      city: 'Nairobi',
      country: 'Kenya',
      phone: '+254700000000',
      email: 'info@grandhotel.com',
      timezone: 'Africa/Nairobi',
    },
  });
  console.log(`✅ Hotel: ${hotel.name}`);

  // ─── Create Roles ──────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin', description: 'Full system access' } }),
    prisma.role.upsert({ where: { name: 'manager' }, update: {}, create: { name: 'manager', description: 'Hotel operations and reports' } }),
    prisma.role.upsert({ where: { name: 'receptionist' }, update: {}, create: { name: 'receptionist', description: 'Front desk operations' } }),
    prisma.role.upsert({ where: { name: 'housekeeping' }, update: {}, create: { name: 'housekeeping', description: 'Room cleaning and maintenance' } }),
    prisma.role.upsert({ where: { name: 'accountant' }, update: {}, create: { name: 'accountant', description: 'Billing and financial operations' } }),
  ]);
  console.log(`✅ Roles seeded: ${roles.map((r) => r.name).join(', ')}`);

  // ─── Create Admin User ─────────────────────────────────────────────────────
  const adminRole = roles.find((r) => r.name === 'admin')!;
  const passwordHash = await bcrypt.hash('Admin@1234', 12);

  await prisma.user.upsert({
    where: { email: 'admin@grandhotel.com' },
    update: {},
    create: {
      hotelId: hotel.id,
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@grandhotel.com',
      passwordHash,
      roleId: adminRole.id,
    },
  });
  console.log('✅ Admin user created: admin@grandhotel.com / Admin@1234');

  // ─── Create Room Types ─────────────────────────────────────────────────────
  await prisma.roomType.createMany({
    skipDuplicates: true,
    data: [
      { hotelId: hotel.id, name: 'Standard Single', description: 'Comfortable single room', baseRate: 80, maxOccupancy: 1, amenities: ['WiFi', 'AC', 'TV'] },
      { hotelId: hotel.id, name: 'Standard Double', description: 'Spacious double room', baseRate: 120, maxOccupancy: 2, amenities: ['WiFi', 'AC', 'TV', 'Mini Fridge'] },
      { hotelId: hotel.id, name: 'Deluxe Suite', description: 'Luxury suite with city view', baseRate: 250, maxOccupancy: 3, amenities: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Jacuzzi', 'Balcony'] },
    ],
  });
  console.log('✅ Room types seeded');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
