import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: {
        include: { permission: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${roles.length} roles in database:\n`);

  for (const r of roles) {
    const deletePerms = r.rolePermissions
      .filter((rp) => rp.permission.action === 'delete')
      .map((rp) => `${rp.permission.resource}:${rp.permission.action}`);

    console.log(`Role: [${r.name}]`);
    console.log(`  Description: ${r.description}`);
    console.log(`  Total Permissions: ${r.rolePermissions.length}`);
    console.log(`  Delete Permissions: ${deletePerms.join(', ') || 'NONE'}`);
    console.log('');
  }

  await prisma.$disconnect();
}

check().catch((err) => {
  console.error(err);
  process.exit(1);
});
