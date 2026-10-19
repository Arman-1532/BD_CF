const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  const adminEmail = 'admin@example.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123456', 10);
    const admin = await prisma.user.create({
      data: {
        displayName: 'System Admin',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        status: 'active'
      }
    });
    console.log(`Created admin user: ${admin.email}`);
  } else {
    console.log('Admin user already exists.');
  }

  const categories = [
    'Medical',
    'Education',
    'Environment',
    'Emergency Relief',
    'Community',
    'Technology'
  ];

  for (const catName of categories) {
    await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName }
    });
  }
  console.log('Seeded default categories.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
