import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { registrationRateLimiter } from '../middleware/rateLimiter';
import { generateQRCodeDataUrl, generateTeamToken, generateParticipantToken } from '../services/qrService';
import { sendRegistrationConfirmationEmail } from '../services/emailService';
import { broadcastLiveStats } from '../services/socketService';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth';
import { EventStatus, AttendanceStatus } from '@prisma/client';

const router = Router();

const registrationSchema = z.object({
  eventId: z.string().optional(),
  schoolId: z.string().uuid(),
  teamName: z.string().min(2, 'Team name must be at least 2 characters').max(50),
  participants: z
    .array(
      z.object({
        name: z.string().min(2, 'Name is required'),
        email: z.string().email('Valid email is required'),
        phone: z.string().min(6, 'Valid phone number is required'),
      })
    )
    .min(1, 'At least 1 participant is required'),
});

// POST /api/registrations - Public registration
router.post('/', registrationRateLimiter, async (req, res, next) => {
  try {
    const data = registrationSchema.parse(req.body);

    // 1. Get Event (specified or current LAUNCHED)
    const event = data.eventId
      ? await prisma.event.findUnique({ where: { id: data.eventId } })
      : await prisma.event.findFirst({
          where: { status: EventStatus.LAUNCHED },
          orderBy: { created_at: 'desc' },
        });

    if (!event) {
      res.status(400).json({ error: 'No active event is open for registration at this time.' });
      return;
    }

    if (event.status !== EventStatus.LAUNCHED) {
      res.status(400).json({
        error: `Registration is not open for this event (Current status: ${event.status}).`,
      });
      return;
    }

    // 2. Validate Team Size
    if (data.participants.length < event.min_team_size || data.participants.length > event.max_team_size) {
      res.status(400).json({
        error: `Team size must be between ${event.min_team_size} and ${event.max_team_size} members.`,
      });
      return;
    }

    // 3. Domain validation if configured
    if (event.allowed_email_domain) {
      const domain = event.allowed_email_domain.toLowerCase().replace(/^@/, '');
      for (const p of data.participants) {
        const emailDomain = p.email.split('@')[1]?.toLowerCase();
        if (emailDomain !== domain) {
          res.status(400).json({
            error: `All emails must belong to @${domain}. Invalid email: ${p.email}`,
          });
          return;
        }
      }
    }

    // 4. Verify School
    const school = await prisma.school.findUnique({
      where: { id: data.schoolId },
    });

    if (!school) {
      res.status(400).json({ error: 'Selected school was not found.' });
      return;
    }

    // 5. Check for duplicate emails within this event
    const emails = data.participants.map((p) => p.email.toLowerCase());
    const existingParticipants = await prisma.participant.findMany({
      where: {
        is_deleted: false,
        university_email: { in: emails },
        team: {
          event_id: event.id,
          is_deleted: false,
        },
      },
      select: { university_email: true },
    });

    if (existingParticipants.length > 0) {
      const duplicateEmails = existingParticipants.map((p) => p.university_email).join(', ');
      res.status(409).json({
        error: `The following email(s) are already registered for this event: ${duplicateEmails}`,
      });
      return;
    }

    // 6. Generate unique tokens
    const teamToken = generateTeamToken(school.code);
    const participantTokens = data.participants.map(() => generateParticipantToken());

    // 7. Atomic Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          event_id: event.id,
          school_id: school.id,
          team_name: data.teamName,
          team_size: data.participants.length,
          qr_token: teamToken,
          participants: {
            create: data.participants.map((p, idx) => ({
              name: p.name.trim(),
              university_email: p.email.trim().toLowerCase(),
              phone: p.phone.trim(),
              qr_code_token: participantTokens[idx],
              attendance_status: AttendanceStatus.NOT_ATTENDED,
            })),
          },
        },
        include: {
          participants: true,
          school: true,
        },
      });

      return team;
    });

    // 8. Generate QR Code Data URLs for immediate display
    const teamQrDataUrl = await generateQRCodeDataUrl(result.qr_token, school.color_code);
    const participantQrDataUrls = await Promise.all(
      result.participants.map((p) => generateQRCodeDataUrl(p.qr_code_token, school.color_code))
    );

    // 9. Dispatch real email asynchronously (non-blocking)
    const primaryContactEmail = data.participants[0].email;
    sendRegistrationConfirmationEmail({
      toEmail: primaryContactEmail,
      teamName: result.team_name,
      schoolName: school.name,
      schoolColor: school.color_code,
      eventName: event.name,
      teamToken: result.qr_token,
      participants: result.participants.map((p) => ({
        name: p.name,
        email: p.university_email,
        qrToken: p.qr_code_token,
      })),
    }).catch((err) => console.error('Failed to send confirmation email:', err));

    // 10. Broadcast updated stats
    const totalTeams = await prisma.team.count({ where: { event_id: event.id, is_deleted: false } });
    const totalParticipants = await prisma.participant.count({
      where: { is_deleted: false, team: { event_id: event.id, is_deleted: false } },
    });
    broadcastLiveStats({ totalTeams, totalParticipants });

    res.status(201).json({
      message: 'Registration completed successfully!',
      team: {
        id: result.id,
        teamName: result.team_name,
        teamSize: result.team_size,
        qrToken: result.qr_token,
        school: {
          id: school.id,
          name: school.name,
          code: school.code,
          colorCode: school.color_code,
        },
      },
      participants: result.participants.map((p, idx) => ({
        id: p.id,
        name: p.name,
        email: p.university_email,
        phone: p.phone,
        qrToken: p.qr_code_token,
        qrDataUrl: participantQrDataUrls[idx],
      })),
      teamQrDataUrl,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/registrations/confirmation/:teamId - View confirmation pass
router.get('/confirmation/:teamId', async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        school: true,
        event: true,
        participants: {
          where: { is_deleted: false },
        },
      },
    });

    if (!team || team.is_deleted) {
      res.status(404).json({ error: 'Registration record not found.' });
      return;
    }

    const teamQrDataUrl = await generateQRCodeDataUrl(team.qr_token, team.school.color_code);
    const participantQrs = await Promise.all(
      team.participants.map(async (p) => ({
        id: p.id,
        name: p.name,
        email: p.university_email,
        phone: p.phone,
        qrToken: p.qr_code_token,
        attendanceStatus: p.attendance_status,
        qrDataUrl: await generateQRCodeDataUrl(p.qr_code_token, team.school.color_code),
      }))
    );

    res.json({
      team: {
        id: team.id,
        teamName: team.team_name,
        teamSize: team.team_size,
        qrToken: team.qr_token,
        checkedIn: team.checked_in,
        school: team.school,
        event: {
          id: team.event.id,
          name: team.event.name,
          sponsor_name: team.event.sponsor_name,
          sponsor_logo_url: team.event.sponsor_logo_url,
          event_date: team.event.event_date,
        },
      },
      teamQrDataUrl,
      participants: participantQrs,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/registrations/soft-delete - Superadmin only with explicit confirmation
router.post('/soft-delete', authenticateToken, requireSuperAdmin, async (req, res, next) => {
  try {
    const { teamId, confirmation } = req.body;

    if (!confirmation) {
      res.status(400).json({
        error: 'Confirmation is required. Set confirmation: true to perform soft-delete.',
      });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { participants: true },
    });

    if (!team) {
      res.status(404).json({ error: 'Team not found.' });
      return;
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.team.update({
        where: { id: teamId },
        data: {
          is_deleted: true,
          deleted_at: now,
        },
      }),
      prisma.participant.updateMany({
        where: { team_id: teamId },
        data: {
          is_deleted: true,
          deleted_at: now,
        },
      }),
    ]);

    res.json({
      message: `Team "${team.team_name}" and its participants were successfully soft-deleted.`,
      teamId,
      softDeletedAt: now,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
