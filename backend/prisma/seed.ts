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

  // 2. Seed Users
  const superAdminPassword = await bcrypt.hash('Admin@123', 10);
  const facultyPassword = await bcrypt.hash('Faculty@123', 10);
  const volunteerPassword = await bcrypt.hash('Volunteer@123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@clubgo.edu' },
    update: {},
    create: {
      name: 'Super Coordinator',
      email: 'admin@clubgo.edu',
      password_hash: superAdminPassword,
      role: Role.SUPERADMIN,
    },
  });

  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@clubgo.edu' },
    update: {},
    create: {
      name: 'Dr. Evelyn Reed (Faculty Lead)',
      email: 'faculty@clubgo.edu',
      password_hash: facultyPassword,
      role: Role.FACULTY,
    },
  });

  const volunteer = await prisma.user.upsert({
    where: { email: 'volunteer@clubgo.edu' },
    update: {},
    create: {
      name: 'Alex Rivera (Lead Volunteer)',
      email: 'volunteer@clubgo.edu',
      password_hash: volunteerPassword,
      role: Role.VOLUNTEER,
    },
  });

  console.log('✅ Default users seeded (admin@clubgo.edu, faculty@clubgo.edu, volunteer@clubgo.edu)');

  // 3. Seed Active Event
  const socseSchool = await prisma.school.findUnique({ where: { code: 'SOCSE' } });
  const soisSchool = await prisma.school.findUnique({ where: { code: 'SOIS' } });

  const existingEvent = await prisma.event.findFirst();
  let event = existingEvent;

  if (!existingEvent) {
    event = await prisma.event.create({
      data: {
        name: 'ClubGo Tech & Innovation Summit 2026',
        description: 'The annual flagship hackathon and technology symposium featuring 1000+ top engineering and design students.',
        sponsor_name: 'Google Cloud & Vertex AI',
        sponsor_logo_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=100&fit=crop',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: EventStatus.LAUNCHED,
        min_team_size: 1,
        max_team_size: 4,
        allowed_email_domain: null, // Allow open registration or university.edu
      },
    });
    console.log(`✅ Sample active event created: "${event.name}" [LAUNCHED]`);
  }

  // 4. Seed Demo Teams if no teams exist
  const teamCount = await prisma.team.count();
  if (teamCount === 0 && event && socseSchool && soisSchool) {
    // Team 1: Binary Titans (SOCSE)
    const team1 = await prisma.team.create({
      data: {
        event_id: event.id,
        school_id: socseSchool.id,
        team_name: 'Binary Titans',
        team_size: 2,
        qr_token: 'TEAM-DEMO-SOCSE-001',
        checked_in: false,
        participants: {
          create: [
            {
              name: 'Liam Chen',
              university_email: 'liam.chen@university.edu',
              phone: '+1 555-0192',
              qr_code_token: 'PART-DEMO-001',
              attendance_status: AttendanceStatus.NOT_ATTENDED,
            },
            {
              name: 'Sarah Connor',
              university_email: 'sarah.c@university.edu',
              phone: '+1 555-0193',
              qr_code_token: 'PART-DEMO-002',
              attendance_status: AttendanceStatus.NOT_ATTENDED,
            },
          ],
        },
      },
    });

    // Team 2: Cyber Visionaries (SOIS) - 1 member already checked in
    const team2 = await prisma.team.create({
      data: {
        event_id: event.id,
        school_id: soisSchool.id,
        team_name: 'Cyber Visionaries',
        team_size: 2,
        qr_token: 'TEAM-DEMO-SOIS-002',
        checked_in: true,
        checked_in_at: new Date(),
        participants: {
          create: [
            {
              name: 'Maya Patel',
              university_email: 'maya.p@university.edu',
              phone: '+1 555-0194',
              qr_code_token: 'PART-DEMO-003',
              attendance_status: AttendanceStatus.CHECKED_IN,
              checked_in_at: new Date(),
            },
            {
              name: 'David Kim',
              university_email: 'david.k@university.edu',
              phone: '+1 555-0195',
              qr_code_token: 'PART-DEMO-004',
              attendance_status: AttendanceStatus.NOT_ATTENDED,
            },
          ],
        },
      },
    });

    console.log('✅ Demo teams and participants created for immediate testing');
  }

  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
