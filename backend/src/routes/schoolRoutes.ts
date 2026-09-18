import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, requireFacultyOrAdmin } from '../middleware/auth';

const router = Router();

// GET /api/schools - List all schools with colors
router.get('/', async (req, res, next) => {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { code: 'asc' },
    });
    res.json(schools);
  } catch (err) {
    next(err);
  }
});

const schoolUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  color_code: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Must be a valid 6-character hex color (e.g. #F59E0B)'),
});

// PUT /api/schools/:id - Update school name or color code
router.put('/:id', authenticateToken, requireFacultyOrAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color_code } = schoolUpdateSchema.parse(req.body);

    const updated = await prisma.school.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        color_code,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/schools - Add a new school if needed
router.post('/', authenticateToken, requireFacultyOrAdmin, async (req, res, next) => {
  try {
    const createSchema = z.object({
      name: z.string().min(2),
      code: z.string().min(2).max(10).toUpperCase(),
      color_code: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Must be a valid 6-character hex color (e.g. #F59E0B)'),
    });

    const data = createSchema.parse(req.body);

    const school = await prisma.school.create({
      data,
    });

    res.status(201).json(school);
  } catch (err) {
    next(err);
  }
});

export default router;
