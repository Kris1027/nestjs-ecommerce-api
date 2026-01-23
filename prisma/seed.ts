import { PrismaClient, Role } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../src/config/env.validation';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: '$2b$12$placeholder.hash.will.be.replaced.by.real.hash',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
    },
  });

  // Create test customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: '$2b$12$placeholder.hash.will.be.replaced.by.real.hash',
      firstName: 'Test',
      lastName: 'Customer',
      role: Role.CUSTOMER,
    },
  });

  console.log('✅ Seeded users:', { admin: admin.email, customer: customer.email });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
