import { Router, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { authenticateToken, requireFacultyOrAdmin, requireSuperAdmin, AuthRequest } from '../middleware/auth';
import { EventStatus } from '../types/enums';

const router = Router();

// GET /api/results/public - Anonymous public results / leaderboard (masked individual identities)
router.get('/public', async (req, res, next) => {
  try {
    let activeEvent = await prisma.event.findFirst({
      where: {
        status: { in: [EventStatus.LAUNCHED, EventStatus.CLOSED] },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!activeEvent) {
      activeEvent = await prisma.event.findFirst({
        orderBy: { created_at: 'desc' },
      });
    }

    if (!activeEvent) {
      res.json({ event: null, results: [] });
      return;
    }

    const results = await prisma.eventResult.findMany({
      where: {
        event_id: activeEvent.id,
        is_published: true,
      },
      include: {
        team: {
          select: {
            id: true,
            team_name: true,
            team_size: true,
            school: {
              select: {
                name: true,
                code: true,
                color_code: true,
              },
            },
          },
        },
      },
      orderBy: [
        { rank: 'asc' },
        { created_at: 'asc' },
      ],
    });

    // Masked public format (no individual participant names or certificate URLs leaked)
    const publicLeaderboard = results.map((r) => ({
      id: r.id,
      rank: r.rank,
      awardTitle: r.award_title || (r.rank ? `Rank #${r.rank}` : 'Special Mention'),
      teamName: `Team [${r.team.school.code}]`, // Fully masked for public confidentiality
      teamSize: r.team.team_size,
      school: r.team.school,
      hasCertificates: true,
    }));

    res.json({
      event: {
        id: activeEvent.id,
        name: activeEvent.name,
        description: activeEvent.description,
        eventDate: activeEvent.event_date,
      },
      results: publicLeaderboard,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/results/unlock - Enter Team Name to unlock individual member certificates
const unlockSchema = z.object({
  teamName: z.string().min(1, 'Team name is required'),
});

router.post('/unlock', async (req, res, next) => {
  try {
    const { teamName } = unlockSchema.parse(req.body);
    const searchName = teamName.trim().toLowerCase();

    const activeEvent = await prisma.event.findFirst({
      where: {
        status: { in: [EventStatus.LAUNCHED, EventStatus.CLOSED] },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!activeEvent) {
      res.status(404).json({ error: 'No event results are active at this time.' });
      return;
    }

    // Find team in active event (case-insensitive)
    const teams = await prisma.team.findMany({
      where: {
        event_id: activeEvent.id,
        is_deleted: false,
      },
      include: {
        school: true,
        participants: {
          where: { is_deleted: false },
        },
        results: {
          include: {
            certificates: {
              include: {
                participant: true,
              },
            },
          },
        },
      },
    });

    const matchingTeams = teams.filter((t) => {
      const matchName = t.team_name.trim().toLowerCase() === searchName;
      const matchToken = t.qr_token.toLowerCase() === searchName;
      const matchParticipant = t.participants.some(
        (p) =>
          p.university_email.toLowerCase() === searchName ||
          p.name.toLowerCase() === searchName ||
          p.qr_code_token.toLowerCase() === searchName
      );
      return matchName || matchToken || matchParticipant;
    });

    if (matchingTeams.length === 0) {
      res.status(404).json({
        error: `No team found matching "${teamName}". Please check your registered Team Name or University Email.`,
      });
      return;
    }

    // Prioritize team that has published results
    const matchedTeam = matchingTeams.find((t) => t.results.some((r) => r.is_published)) || matchingTeams[0];

    const teamResult = matchedTeam.results.find((r) => r.is_published);
    if (!teamResult) {
      res.status(404).json({
        error: `Results for team "${matchedTeam.team_name}" have not been finalized or published yet. Please check back after the ceremony.`,
      });
      return;
    }

    // Return unlocked official team record with individual member certificates
    res.json({
      unlocked: true,
      event: {
        id: activeEvent.id,
        name: activeEvent.name,
        eventDate: activeEvent.event_date,
        sponsorName: activeEvent.sponsor_name,
      },
      team: {
        id: matchedTeam.id,
        teamName: matchedTeam.team_name,
        teamSize: matchedTeam.team_size,
        school: {
          id: matchedTeam.school.id,
          name: matchedTeam.school.name,
          code: matchedTeam.school.code,
          colorCode: matchedTeam.school.color_code,
        },
      },
      result: {
        id: teamResult.id,
        rank: teamResult.rank,
        awardTitle: teamResult.award_title,
        remarks: teamResult.remarks,
      },
      certificates: teamResult.certificates.map((c) => ({
        id: c.id,
        certificateNo: c.certificate_no,
        recipientName: c.recipient_name,
        awardTitle: c.award_title,
        issueDate: c.issue_date,
        certificateUrl: c.certificate_url,
        participant: {
          id: c.participant.id,
          email: c.participant.university_email,
          phone: c.participant.phone,
        },
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/results/admin - SuperAdmin/Faculty list of all teams and result assignments
router.get('/admin', authenticateToken, requireFacultyOrAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const activeEvent = await prisma.event.findFirst({
      where: {
        status: { in: [EventStatus.LAUNCHED, EventStatus.CLOSED] },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!activeEvent) {
      res.json({ event: null, teams: [] });
      return;
    }

    const teams = await prisma.team.findMany({
      where: {
        event_id: activeEvent.id,
        is_deleted: false,
      },
      include: {
        school: true,
        participants: {
          where: { is_deleted: false },
        },
        results: {
          include: {
            certificates: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      event: activeEvent,
      teams: teams.map((t) => ({
        id: t.id,
        teamName: t.team_name,
        teamSize: t.team_size,
        qrToken: t.qr_token,
        checkedIn: t.checked_in,
        school: t.school,
        participants: t.participants,
        result: t.results[0] || null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/results - SuperAdmin assigns or updates team results and generates certificates
const saveResultSchema = z.object({
  eventId: z.string().min(1),
  teamId: z.string().min(1),
  rank: z.number().int().min(1).nullable().optional(),
  awardTitle: z.string().min(2, 'Award or position title is required'),
  remarks: z.string().optional(),
  isPublished: z.boolean().default(true),
  customCertificateUrl: z.string().optional().nullable(),
  memberCertificates: z
    .array(
      z.object({
        participantId: z.string(),
        certificateUrl: z.string().optional().nullable(),
      })
    )
    .optional(),
});

router.post('/', authenticateToken, requireFacultyOrAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = saveResultSchema.parse(req.body);

    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
      include: {
        school: true,
        participants: { where: { is_deleted: false } },
      },
    });

    if (!team) {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }

    // Upsert EventResult
    const result = await prisma.eventResult.upsert({
      where: {
        event_id_team_id: {
          event_id: data.eventId,
          team_id: data.teamId,
        },
      },
      update: {
        rank: data.rank ?? null,
        award_title: data.awardTitle,
        remarks: data.remarks ?? null,
        is_published: data.isPublished,
      },
      create: {
        event_id: data.eventId,
        team_id: data.teamId,
        rank: data.rank ?? null,
        award_title: data.awardTitle,
        remarks: data.remarks ?? null,
        is_published: data.isPublished,
      },
    });

    // Auto-generate or update Certificate records for each team member
    const currentYear = new Date().getFullYear();
    const schoolCode = team.school.code;

    for (const p of team.participants) {
      const certSerial = `CERT-${currentYear}-${schoolCode}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // Check for member-specific certificate PNG / URL
      const memberEntry = data.memberCertificates?.find((m) => m.participantId === p.id);
      let certUrl = data.customCertificateUrl || null;
      if (memberEntry !== undefined) {
        certUrl = memberEntry.certificateUrl || null;
      }

      await prisma.certificate.upsert({
        where: {
          result_id_participant_id: {
            result_id: result.id,
            participant_id: p.id,
          },
        },
        update: {
          recipient_name: p.name,
          award_title: data.awardTitle,
          certificate_url: certUrl,
        },
        create: {
          result_id: result.id,
          participant_id: p.id,
          certificate_no: certSerial,
          recipient_name: p.name,
          award_title: data.awardTitle,
          certificate_url: certUrl,
        },
      });
    }

    const fullResult = await prisma.eventResult.findUnique({
      where: { id: result.id },
      include: {
        certificates: {
          include: { participant: true },
        },
        team: { include: { school: true } },
      },
    });

    res.status(201).json({
      message: `Result and ${team.participants.length} certificates generated successfully for "${team.team_name}".`,
      result: fullResult,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/results/:id/publish - SuperAdmin toggle publication
router.patch('/:id/publish', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const updated = await prisma.eventResult.update({
      where: { id },
      data: { is_published: Boolean(isPublished) },
    });

    res.json({
      message: `Results ${updated.is_published ? 'published' : 'unpublished'} successfully.`,
      result: updated,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/results/:id - SuperAdmin remove result
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    await prisma.eventResult.delete({
      where: { id },
    });

    res.json({ message: 'Result and associated certificates removed.' });
  } catch (err) {
    next(err);
  }
});

export default router;
