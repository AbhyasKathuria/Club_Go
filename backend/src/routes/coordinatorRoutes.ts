import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, requireFacultyOrAdmin, requireSuperAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/coordinators - List all student coordinators
router.get('/', authenticateToken, requireFacultyOrAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const coordinators = await prisma.user.findMany({
      where: {
        role: 'VOLUNTEER',
      },
      select: {
        id: true,
        name: true,
        username: true,
        roll_number: true,
        email: true,
        phone: true,
        school_name: true,
        is_approved: true,
        created_at: true,
        _count: {
          select: { attendance_logs: true },
        },
      },
      orderBy: [
        { is_approved: 'asc' }, // Pending first
        { created_at: 'desc' },
      ],
    });

    res.json(coordinators);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/coordinators/:id/approve - SuperAdmin approves coordinator access
router.patch('/:id/approve', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { is_approved: true },
      select: {
        id: true,
        name: true,
        username: true,
        roll_number: true,
        is_approved: true,
      },
    });

    res.json({
      message: `Access approved for Student Co-ordinator "${user.name}" (${user.username}).`,
      coordinator: user,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/coordinators/:id/revoke - SuperAdmin revokes coordinator access
router.patch('/:id/revoke', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { is_approved: false },
      select: {
        id: true,
        name: true,
        username: true,
        roll_number: true,
        is_approved: true,
      },
    });

    res.json({
      message: `Access revoked for Student Co-ordinator "${user.name}".`,
      coordinator: user,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/coordinators/:id - SuperAdmin deletes a coordinator record
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    // Check if logs exist
    const logCount = await prisma.attendanceLog.count({
      where: { volunteer_id: id },
    });

    if (logCount > 0) {
      res.status(400).json({
        error: `Cannot delete coordinator because they have recorded ${logCount} scan attendance audit logs. Revoke access instead.`,
      });
      return;
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'Student Co-ordinator record removed.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/coordinators - SuperAdmin directly adds a pre-approved coordinator
const createCoordinatorSchema = z
  .object({
    name: z.string().min(2),
    username: z.string().min(3),
    password: z.string().optional(),
    roll_number: z.string().optional(),
    rollNumber: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    school_name: z.string().optional(),
    schoolName: z.string().optional(),
  })
  .refine((data) => !!(data.password || data.roll_number || data.rollNumber), {
    message: 'Valid password is required',
    path: ['password'],
  });

router.post('/', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = createCoordinatorSchema.parse(req.body);
    const normalizedUsername = data.username.toLowerCase().trim();
    const rawPass = (data.password || data.roll_number || data.rollNumber || '').trim();
    const rollRaw = (data.roll_number || data.rollNumber || '').trim();
    const normalizedRoll = rollRaw ? rollRaw.toUpperCase() : null;
    const normalizedEmail = data.email.toLowerCase().trim();
    const schoolName = (data.school_name || data.schoolName || '').trim() || null;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: normalizedUsername },
          ...(normalizedRoll ? [{ roll_number: normalizedRoll }] : []),
        ],
      },
    });

    if (existing) {
      res.status(409).json({ error: 'A user with this email or username already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(rawPass, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        username: normalizedUsername,
        roll_number: normalizedRoll,
        email: normalizedEmail,
        password_hash: passwordHash,
        role: 'VOLUNTEER',
        is_approved: true, // SuperAdmin created, so pre-approved
        phone: data.phone?.trim() || null,
        school_name: schoolName,
      },
    });

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
