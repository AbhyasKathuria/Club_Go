import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/database';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /api/auth/login - for Superadmin, Faculty, or Volunteer
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/coordinator/register - Disabled (Co-ordinators are directly allocated by SuperAdmin)
router.post('/coordinator/register', async (req, res) => {
  res.status(403).json({
    error: 'Public co-ordinator registration is disabled. Student Co-ordinators are directly appointed and allocated by the Super Admin in the Admin Portal.',
  });
});

// POST /api/auth/coordinator/login - Login via Username + Password
const coordinatorLoginSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().optional(),
    roll_number: z.string().optional(),
    rollNumber: z.string().optional(),
  })
  .refine((data) => !!(data.password || data.roll_number || data.rollNumber), {
    message: 'Password is required',
    path: ['password'],
  });

router.post('/coordinator/login', async (req, res, next) => {
  try {
    const data = coordinatorLoginSchema.parse(req.body);
    const searchUser = data.username.toLowerCase().trim();
    const passwordInput = (data.password || data.roll_number || data.rollNumber || '').trim();

    // Search by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: searchUser },
          { email: searchUser },
          { roll_number: searchUser.toUpperCase() },
        ],
      },
    });

    if (!user) {
      res.status(401).json({ error: 'No Student Co-ordinator found with these credentials.' });
      return;
    }

    // Verify password matches bcrypt hash, or matches user.roll_number for legacy accounts
    const passwordValid =
      (await bcrypt.compare(passwordInput, user.password_hash)) ||
      (await bcrypt.compare(passwordInput.toUpperCase(), user.password_hash)) ||
      (user.roll_number && user.roll_number.toUpperCase() === passwordInput.toUpperCase());

    if (!passwordValid) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    // Check approval status
    if (!user.is_approved) {
      res.status(403).json({
        error: 'Your Student Co-ordinator account is currently pending approval by the Super Admin. Please contact the faculty coordinator to grant access.',
        is_approved: false,
      });
      return;
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        roll_number: user.roll_number,
        email: user.email,
        role: user.role,
        is_approved: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me - Verify current user session
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

export default router;
