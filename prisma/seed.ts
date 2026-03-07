import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set');

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('MediaOS2026!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'lucus@initiative.com' },
    update: {},
    create: {
      email: 'lucus@initiative.com',
      passwordHash,
      name: 'Lucus Dato',
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', admin.email);

  const planner = await prisma.user.upsert({
    where: { email: 'danielle@initiative.com' },
    update: {},
    create: {
      email: 'danielle@initiative.com',
      passwordHash: await bcrypt.hash('Planner2026!', 12),
      name: 'Danielle Cheung',
      role: 'PLANNER',
    },
  });

  console.log('Planner user created:', planner.email);

  const kinesso = await prisma.user.upsert({
    where: { email: 'kinesso@initiative.com' },
    update: {},
    create: {
      email: 'kinesso@initiative.com',
      passwordHash: await bcrypt.hash('Kinesso2026!', 12),
      name: 'Kinesso Team',
      role: 'KINESSO',
    },
  });

  console.log('Kinesso user created:', kinesso.email);

  // Create a sample campaign
  const campaign = await prisma.campaign.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: "Hellmann's Back to School 2026",
      client: 'Unilever',
      businessUnit: 'Foods & Wellness',
      status: 'PLANNING',
      startDate: new Date('2026-05-01'),
      endDate: new Date('2026-08-31'),
      totalBudget: 1917500,
      createdById: admin.id,
    },
  });

  console.log('Sample campaign created:', campaign.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
