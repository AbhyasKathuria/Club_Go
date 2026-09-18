import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';
import { ENV } from '../config/env';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

export async function createDatabaseSnapshot(): Promise<{
  timestamp: string;
  data: any;
}> {
  const [schools, events, teams, participants, attendanceLogs, users] = await Promise.all([
    prisma.school.findMany(),
    prisma.event.findMany(),
    prisma.team.findMany({
      include: {
        participants: true,
      },
    }),
    prisma.participant.findMany(),
    prisma.attendanceLog.findMany(),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    }),
  ]);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshot = {
    metadata: {
      generated_at: new Date().toISOString(),
      version: '1.0.0',
      total_teams: teams.length,
      total_participants: participants.length,
      total_logs: attendanceLogs.length,
    },
    schools,
    events,
    teams,
    participants,
    attendanceLogs,
    users,
  };

  return { timestamp, data: snapshot };
}

export function initAutomatedBackups() {
  // Ensure backups directory exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Schedule cron job based on configured hours (e.g. every 6 hours)
  const cronExpression = `0 */${ENV.BACKUP_INTERVAL_HOURS} * * *`;
  console.log(`⏰ Scheduled automated database backups with cron: "${cronExpression}"`);

  cron.schedule(cronExpression, async () => {
    try {
      console.log('🔄 Running automated database backup snapshot...');
      const { timestamp, data } = await createDatabaseSnapshot();
      const filePath = path.join(BACKUP_DIR, `snapshot_${timestamp}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`💾 Automated backup snapshot saved to: ${filePath}`);
    } catch (err) {
      console.error('❌ Failed to create automated backup snapshot:', err);
    }
  });
}
