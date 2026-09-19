import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, requireFacultyOrAdmin, requireSuperAdmin } from '../middleware/auth';
import { uploadLogo, processSponsorLogo } from '../services/storageService';
import { EventStatus } from '../types/enums';

const router = Router();

// GET /api/events/active - Public endpoint to retrieve the active event for registration or admin config
router.get('/active', async (req, res, next) => {
  try {
    // 1. First look for an active LAUNCHED event
    let event = await prisma.event.findFirst({
      where: {
        status: EventStatus.LAUNCHED,
      },
      orderBy: { created_at: 'desc' },
    });

    // 2. If no event is currently LAUNCHED, fallback to the latest event (DRAFT or CLOSED)
    // so the admin portal can see and edit the event currently being configured.
    if (!event) {
      event = await prisma.event.findFirst({
        orderBy: { created_at: 'desc' },
      });
    }

    const schools = await prisma.school.findMany({
      orderBy: { code: 'asc' },
    });

    res.json({
      event: event || null,
      schools,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/all - Admin endpoint to list all events
router.get('/all', authenticateToken, requireFacultyOrAdmin, async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { teams: true },
        },
      },
    });
    res.json(events);
  } catch (err) {
    next(err);
  }
});

const eventSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  sponsor_name: z.string().optional(),
  sponsor_logo_url: z.string().optional(),
  event_date: z.string().optional(),
  status: z.enum(['DRAFT', 'LAUNCHED', 'CLOSED']).optional(),
  min_team_size: z.number().int().min(1).default(1),
  max_team_size: z.number().int().min(1).default(4),
  allowed_email_domain: z.string().nullable().optional(),
  form_config: z.string().nullable().optional(),
});

// POST /api/events - Create or update event (Superadmin & Faculty)
router.post('/', authenticateToken, requireFacultyOrAdmin, async (req, res, next) => {
  try {
    const data = eventSchema.parse(req.body);

    const existingEvent = await prisma.event.findFirst({
      orderBy: { created_at: 'desc' },
    });

    if (existingEvent) {
      const updateData: any = { ...data };
      if (data.event_date) {
        updateData.event_date = new Date(data.event_date);
      }
      const updated = await prisma.event.update({
        where: { id: existingEvent.id },
        data: updateData,
      });
      res.status(200).json(updated);
      return;
    }

    const event = await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        sponsor_name: data.sponsor_name,
        sponsor_logo_url: data.sponsor_logo_url,
        event_date: data.event_date ? new Date(data.event_date) : null,
        status: data.status ? (data.status as EventStatus) : EventStatus.DRAFT,
        min_team_size: data.min_team_size,
        max_team_size: data.max_team_size,
        allowed_email_domain: data.allowed_email_domain,
        form_config: data.form_config,
      },
    });
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:id - Update event details (Superadmin & Faculty)
router.put('/:id', authenticateToken, requireFacultyOrAdmin, async (req, res, next) => {
  try {
    let { id } = req.params;
    if (id === 'active' || id === 'latest') {
      const existing = await prisma.event.findFirst({
        orderBy: { created_at: 'desc' },
      });
      if (existing) {
        id = existing.id;
      }
    }

    const data = eventSchema.partial().parse(req.body);

    const updateData: any = { ...data };
    if (data.event_date) {
      updateData.event_date = new Date(data.event_date);
    }

    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/events/:id/status - Quick toggle status (e.g. Launch or Close)
router.patch('/:id/status', authenticateToken, requireFacultyOrAdmin, async (req, res, next) => {
  try {
    let { id } = req.params;
    if (id === 'active' || id === 'latest') {
      const existing = await prisma.event.findFirst({
        orderBy: { created_at: 'desc' },
      });
      if (existing) {
        id = existing.id;
      }
    }

    const { status } = req.body;

    if (!['DRAFT', 'LAUNCHED', 'CLOSED'].includes(status)) {
      res.status(400).json({ error: 'Invalid event status.' });
      return;
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: status as EventStatus },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:id/upload-logo - Sponsor logo upload
router.post(
  '/:id/upload-logo',
  authenticateToken,
  requireFacultyOrAdmin,
  uploadLogo.single('logo'),
  async (req, res, next) => {
    try {
      let { id } = req.params;
      if (id === 'active' || id === 'latest') {
        const existing = await prisma.event.findFirst({
          orderBy: { created_at: 'desc' },
        });
        if (existing) {
          id = existing.id;
        }
      }

      const { directUrl } = req.body;

      const logoUrl = await processSponsorLogo(req.file, directUrl);
      if (!logoUrl) {
        res.status(400).json({ error: 'No image file or direct URL provided.' });
        return;
      }

      const updated = await prisma.event.update({
        where: { id },
        data: { sponsor_logo_url: logoUrl },
      });

      res.json({ message: 'Sponsor logo updated successfully', sponsor_logo_url: updated.sponsor_logo_url });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
