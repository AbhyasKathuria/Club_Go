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

// POST /api/auth/coordinator/register - Student Co-ordinator registration (awaiting approval)
const coordinatorRegisterSchema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30),
    roll_number: z.string().optional(),
    rollNumber: z.string().optional(),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    school_name: z.string().optional(),
    schoolName: z.string().optional(),
  })
  .refine((data) => !!(data.roll_number || data.rollNumber), {
    message: 'Valid roll number is required',
    path: ['roll_number'],
  });

router.post('/coordinator/register', async (req, res, next) => {
  try {
    const data = coordinatorRegisterSchema.parse(req.body);
    const normalizedUsername = data.username.toLowerCase().trim();
    const rollRaw = (data.roll_number || data.rollNumber || '').trim();
    const normalizedRoll = rollRaw.toUpperCase();
    const normalizedEmail = data.email.toLowerCase().trim();
    const schoolName = (data.school_name || data.schoolName || '').trim() || null;

    // Check for existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: normalizedUsername },
          { roll_number: normalizedRoll },
        ],
      },
    });

    if (existing) {
      if (existing.email === normalizedEmail) {
        res.status(409).json({ error: 'A coordinator with this email already exists.' });
        return;
      }
      if (existing.username === normalizedUsername) {
        res.status(409).json({ error: 'This username is already taken. Please pick another.' });
        return;
      }
      if (existing.roll_number === normalizedRoll) {
        res.status(409).json({ error: 'A coordinator with this roll number is already registered.' });
        return;
      }
    }

    // Default password hash is roll number
    const passwordHash = await bcrypt.hash(normalizedRoll, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        username: normalizedUsername,
        roll_number: normalizedRoll,
        email: normalizedEmail,
        password_hash: passwordHash,
        role: 'VOLUNTEER',
        is_approved: false, // Must be approved by SuperAdmin
        phone: data.phone?.trim() || null,
        school_name: schoolName,
      },
    });

    res.status(201).json({
      message: 'Co-ordinator registration submitted successfully! Your account is pending approval by the Super Admin.',
      coordinator: {
        id: user.id,
        name: user.name,
        username: user.username,
        roll_number: user.roll_number,
        is_approved: false,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/coordinator/login - Login via Username + Roll Number
const coordinatorLoginSchema = z
  .object({
    username: z.string().min(1, 'Username is required'),
    roll_number: z.string().optional(),
    rollNumber: z.string().optional(),
  })
  .refine((data) => !!(data.roll_number || data.rollNumber), {
    message: 'Roll number is required',
    path: ['roll_number'],
  });

router.post('/coordinator/login', async (req, res, next) => {
  try {
    const data = coordinatorLoginSchema.parse(req.body);
    const searchUser = data.username.toLowerCase().trim();
    const rollRaw = (data.roll_number || data.rollNumber || '').trim();
    const searchRoll = rollRaw.toUpperCase();

    // Search by username or roll number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: searchUser },
          { roll_number: searchRoll },
          { email: searchUser },
        ],
      },
    });

    if (!user) {
      res.status(401).json({ error: 'No Student Co-ordinator found with these credentials.' });
      return;
    }

    // Verify roll number matches
    const rollMatch =
      user.roll_number?.toUpperCase().trim() === searchRoll ||
      (await bcrypt.compare(rollRaw, user.password_hash)) ||
      (await bcrypt.compare(searchRoll, user.password_hash));

    if (!rollMatch) {
      res.status(401).json({ error: 'Invalid username or roll number.' });
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
