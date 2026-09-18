import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, requireVolunteerOrAdmin, requireFacultyOrAdmin, AuthRequest } from '../middleware/auth';
import { scanRateLimiter } from '../middleware/rateLimiter';
import { broadcastAttendanceUpdate, broadcastLiveStats } from '../services/socketService';
import { AttendanceStatus, ScanResult, ScanType } from '../types/enums';

const router = Router();

const scanPayloadSchema = z.object({
  qrToken: z.string().min(3),
  scanType: z.enum(['team', 'individual']).optional(),
});

// Helper function to process an individual scan token idempotently
async function processScan(qrToken: string, volunteerId: string, forcedType?: 'team' | 'individual') {
  const token = qrToken.trim();
  const isTeamToken = forcedType === 'team' || token.startsWith('TEAM-');

  // Try matching Team first if designated or if prefix matches
  if (isTeamToken) {
    const team = await prisma.team.findFirst({
      where: { qr_token: token, is_deleted: false },
      include: {
        school: true,
        participants: { where: { is_deleted: false } },
      },
    });

    if (team) {
      // Check idempotency: already checked in?
      if (team.checked_in) {
        await prisma.attendanceLog.create({
          data: {
            team_id: team.id,
            volunteer_id: volunteerId,
            scan_type: ScanType.TEAM,
            result: ScanResult.DUPLICATE,
            metadata: `Duplicate team scan attempt for ${team.team_name}`,
          },
        });

        return {
          status: 'DUPLICATE',
          scanType: 'TEAM',
          message: `Team "${team.team_name}" was already checked in on ${team.checked_in_at?.toLocaleTimeString()}.`,
          timestamp: team.checked_in_at,
          data: {
            teamName: team.team_name,
            school: team.school,
            participants: team.participants,
          },
        };
      }

      // Perform check-in atomically
      const now = new Date();
      const updatedTeam = await prisma.$transaction(async (tx) => {
        const t = await tx.team.update({
          where: { id: team.id },
          data: {
            checked_in: true,
            checked_in_at: now,
          },
          include: {
            school: true,
            participants: { where: { is_deleted: false } },
          },
        });

        // Also mark all team members present
        await tx.participant.updateMany({
          where: { team_id: team.id, is_deleted: false },
          data: {
            attendance_status: AttendanceStatus.CHECKED_IN,
            checked_in_at: now,
          },
        });

        await tx.attendanceLog.create({
          data: {
            team_id: team.id,
            volunteer_id: volunteerId,
            scan_type: ScanType.TEAM,
            result: ScanResult.SUCCESS,
            metadata: `Team checked in: ${team.team_name} (${team.participants.length} members)`,
          },
        });

        return t;
      });

      // Real-time broadcast
      broadcastAttendanceUpdate({
        type: 'team',
        teamId: updatedTeam.id,
        teamName: updatedTeam.team_name,
        schoolCode: updatedTeam.school.code,
        attendanceStatus: 'CHECKED_IN',
        checkedInAt: now.toISOString(),
      });

      return {
        status: 'SUCCESS',
        scanType: 'TEAM',
        message: `Team "${updatedTeam.team_name}" checked in successfully! (${updatedTeam.participants.length} members marked present)`,
        timestamp: now,
        data: {
          teamName: updatedTeam.team_name,
          school: updatedTeam.school,
          participants: updatedTeam.participants,
        },
      };
    }
  }

  // Next, look for Individual Participant
  const participant = await prisma.participant.findFirst({
    where: { qr_code_token: token, is_deleted: false },
    include: {
      team: {
        include: {
          school: true,
          participants: { where: { is_deleted: false } },
        },
      },
    },
  });

  if (participant) {
    // Check idempotency: already checked in?
    if (participant.attendance_status === AttendanceStatus.CHECKED_IN) {
      await prisma.attendanceLog.create({
        data: {
          participant_id: participant.id,
          team_id: participant.team_id,
          volunteer_id: volunteerId,
          scan_type: ScanType.INDIVIDUAL,
          result: ScanResult.DUPLICATE,
          metadata: `Duplicate scan for participant ${participant.name}`,
        },
      });

      return {
        status: 'DUPLICATE',
        scanType: 'INDIVIDUAL',
        message: `${participant.name} was already checked in on ${participant.checked_in_at?.toLocaleTimeString()}.`,
        timestamp: participant.checked_in_at,
        data: {
          participantName: participant.name,
          email: participant.university_email,
          teamName: participant.team.team_name,
          school: participant.team.school,
        },
      };
    }

    // Perform check-in
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.participant.update({
        where: { id: participant.id },
        data: {
          attendance_status: AttendanceStatus.CHECKED_IN,
          checked_in_at: now,
        },
      });

      await tx.attendanceLog.create({
        data: {
          participant_id: participant.id,
          team_id: participant.team_id,
          volunteer_id: volunteerId,
          scan_type: ScanType.INDIVIDUAL,
          result: ScanResult.SUCCESS,
          metadata: `Participant checked in: ${participant.name} (${participant.team.team_name})`,
        },
      });

      // Check if all team members are now checked in
      const remainingUnchecked = await tx.participant.count({
        where: {
          team_id: participant.team_id,
          is_deleted: false,
          attendance_status: AttendanceStatus.NOT_ATTENDED,
        },
      });

      if (remainingUnchecked === 0) {
        await tx.team.update({
          where: { id: participant.team_id },
          data: { checked_in: true, checked_in_at: now },
        });
      }
    });

    // Real-time broadcast
    broadcastAttendanceUpdate({
      type: 'individual',
      teamId: participant.team_id,
      participantId: participant.id,
      participantName: participant.name,
      teamName: participant.team.team_name,
      schoolCode: participant.team.school.code,
      attendanceStatus: 'CHECKED_IN',
      checkedInAt: now.toISOString(),
    });

    return {
      status: 'SUCCESS',
      scanType: 'INDIVIDUAL',
      message: `${participant.name} successfully checked in!`,
      timestamp: now,
      data: {
        participantName: participant.name,
        email: participant.university_email,
        teamName: participant.team.team_name,
        school: participant.team.school,
      },
    };
  }

  // Token was not found anywhere
  return {
    status: 'INVALID',
    message: 'Unrecognized QR Code. No matching team or participant found in this event.',
  };
}

// POST /api/attendance/scan - Real-time scanner endpoint (Volunteers & Admins)
router.post('/scan', authenticateToken, requireVolunteerOrAdmin, scanRateLimiter, async (req: AuthRequest, res: Response, next) => {
  try {
    const { qrToken, scanType } = scanPayloadSchema.parse(req.body);
    const volunteerId = req.user!.id;

    const result = await processScan(qrToken, volunteerId, scanType);

    if (result.status === 'INVALID') {
      res.status(404).json(result);
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/sync-offline - Batch sync for offline scans queue
router.post('/sync-offline', authenticateToken, requireVolunteerOrAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const batchSchema = z.object({
      scans: z.array(
        z.object({
          qrToken: z.string(),
          scanType: z.enum(['team', 'individual']).optional(),
          scannedAt: z.string().optional(),
        })
      ),
    });

    const { scans } = batchSchema.parse(req.body);
    const volunteerId = req.user!.id;

    const results = [];
    let successCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    for (const scan of scans) {
      const outcome = await processScan(scan.qrToken, volunteerId, scan.scanType);
      results.push({
        qrToken: scan.qrToken,
        ...outcome,
      });

      if (outcome.status === 'SUCCESS') successCount++;
      else if (outcome.status === 'DUPLICATE') duplicateCount++;
      else invalidCount++;
    }

    res.json({
      message: `Offline sync finished: ${successCount} new check-ins, ${duplicateCount} duplicates acknowledged, ${invalidCount} invalid.`,
      total: scans.length,
      successCount,
      duplicateCount,
      invalidCount,
      results,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/attendance/live-dashboard - Live metrics & tabular records for Superadmin/Faculty
router.get('/live-dashboard', authenticateToken, requireFacultyOrAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { code: 'asc' },
    });

    const teams = await prisma.team.findMany({
      where: { is_deleted: false },
      include: {
        school: true,
        participants: {
          where: { is_deleted: false },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const totalTeams = teams.length;
    let totalParticipants = 0;
    let checkedInParticipants = 0;
    let checkedInTeams = 0;

    teams.forEach((t) => {
      if (t.checked_in) checkedInTeams++;
      t.participants.forEach((p) => {
        totalParticipants++;
        if (p.attendance_status === AttendanceStatus.CHECKED_IN) {
          checkedInParticipants++;
        }
      });
    });

    const schoolStats = schools.map((s) => {
      const schoolTeams = teams.filter((t) => t.school_id === s.id);
      let sTotalParts = 0;
      let sCheckedInParts = 0;

      schoolTeams.forEach((t) => {
        t.participants.forEach((p) => {
          sTotalParts++;
          if (p.attendance_status === AttendanceStatus.CHECKED_IN) {
            sCheckedInParts++;
          }
        });
      });

      const pct = sTotalParts > 0 ? ((sCheckedInParts / sTotalParts) * 100).toFixed(1) : '0.0';

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        colorCode: s.color_code,
        totalTeams: schoolTeams.length,
        totalParticipants: sTotalParts,
        checkedInParticipants: sCheckedInParts,
        attendancePercentage: pct,
      };
    });

    res.json({
      overview: {
        totalTeams,
        checkedInTeams,
        totalParticipants,
        checkedInParticipants,
        attendancePercentage:
          totalParticipants > 0 ? ((checkedInParticipants / totalParticipants) * 100).toFixed(1) : '0.0',
      },
      schoolStats,
      teams: teams.map((t) => ({
        id: t.id,
        teamName: t.team_name,
        teamSize: t.team_size,
        qrToken: t.qr_token,
        checkedIn: t.checked_in,
        checkedInAt: t.checked_in_at,
        createdAt: t.created_at,
        school: {
          id: t.school.id,
          name: t.school.name,
          code: t.school.code,
          colorCode: t.school.color_code,
        },
        participants: t.participants.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.university_email,
          phone: p.phone,
          qrToken: p.qr_code_token,
          attendanceStatus: p.attendance_status,
          checkedInAt: p.checked_in_at,
        })),
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
