import { PrismaClient } from '@prisma/client';
import { Role, EventStatus, AttendanceStatus } from '../src/types/enums';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Schools
  const schoolsData = [
    { name: 'School of Commerce', code: 'SOC', color_code: '#F59E0B' }, // Yellow
    { name: 'School of Information Science', code: 'SOIS', color_code: '#38BDF8' }, // Light Blue
    { name: 'School of Design', code: 'SOD', color_code: '#EF4444' }, // Red
    { name: 'School of Computer Science & Engineering', code: 'SOCSE', color_code: '#2563EB' }, // Blue
  ];

  for (const s of schoolsData) {
    await prisma.school.upsert({
      where: { code: s.code },
      update: { color_code: s.color_code, name: s.name },
      create: s,
    });
  }
  console.log('✅ Schools seeded: SOC, SOIS, SOD, SOCSE');

  // 2. Clean old demo users
  await prisma.user.deleteMany({
    where: {
      email: { in: ['admin@clubgo.edu', 'faculty@clubgo.edu', 'volunteer@clubgo.edu'] },
    },
  });

  // 3. Clear demo teams and test logs for clean project submission
  await prisma.attendanceLog.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.eventResult.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.event.deleteMany({
    where: { name: { contains: 'ClubGo Tech & Innovation' } },
  });

  // 4. Seed Real Super Admin
  const superAdminPassword = await bcrypt.hash('@Kaushal#^1012', 10);

  await prisma.user.upsert({
    where: { email: 'singhkaushal.2507@gmail.com' },
    update: {
      name: 'Kaushal Singh',
      password_hash: superAdminPassword,
      role: Role.SUPERADMIN,
      is_approved: true,
    },
    create: {
      name: 'Kaushal Singh',
      email: 'singhkaushal.2507@gmail.com',
      password_hash: superAdminPassword,
      role: Role.SUPERADMIN,
      is_approved: true,
    },
  });

  console.log('✅ Real Super Admin seeded: singhkaushal.2507@gmail.com');
  console.log('✨ Database clean & ready for official submission!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
