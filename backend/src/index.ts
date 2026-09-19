import express from 'express';
import http from 'http';
import cors from 'cors';
import { ENV } from './config/env';
import { initSocketServer } from './services/socketService';
import { initAutomatedBackups } from './services/backupService';
import { generalApiLimiter } from './middleware/rateLimiter';
import { prisma } from './config/database';
import { Role } from './types/enums';
import bcrypt from 'bcryptjs';
import { errorHandler } from './middleware/errorHandler';

async function ensureInitialData(): Promise<void> {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🌱 No users found in database. Auto-seeding default schools & Super Admin...');

      const schoolsData = [
        { name: 'School of Commerce', code: 'SOC', color_code: '#F59E0B' },
        { name: 'School of Information Science', code: 'SOIS', color_code: '#38BDF8' },
        { name: 'School of Design', code: 'SOD', color_code: '#EF4444' },
        { name: 'School of Computer Science & Engineering', code: 'SOCSE', color_code: '#2563EB' },
      ];

      for (const s of schoolsData) {
        await prisma.school.upsert({
          where: { code: s.code },
          update: { color_code: s.color_code, name: s.name },
          create: s,
        });
      }

      const superAdminPassword = await bcrypt.hash('Admin@123', 10);
      await prisma.user.upsert({
        where: { email: 'admin@clubgo.edu' },
        update: { is_approved: true },
        create: {
          name: 'Super Coordinator',
          email: 'admin@clubgo.edu',
          password_hash: superAdminPassword,
          role: Role.SUPERADMIN,
          is_approved: true,
        },
      });

      console.log('✅ Auto-seed complete: Super Admin created (admin@clubgo.edu / Admin@123)');
    }
  } catch (err) {
    console.error('⚠️ Auto-initialization check skipped:', err);
  }
}

// Route imports
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import schoolRoutes from './routes/schoolRoutes';
import registrationRoutes from './routes/registrationRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import exportRoutes from './routes/exportRoutes';
import backupRoutes from './routes/backupRoutes';
import coordinatorRoutes from './routes/coordinatorRoutes';
import resultRoutes from './routes/resultRoutes';

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = initSocketServer(httpServer);

// Middleware
app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', '*'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalApiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ClubGo University Event Platform Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/coordinators', coordinatorRoutes);
app.use('/api/results', resultRoutes);

// Error handling middleware
app.use(errorHandler);

// Initialize scheduled background jobs
initAutomatedBackups();

// Start Server
httpServer.listen(ENV.PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 ClubGo Backend Server running on port ${ENV.PORT}`);
  console.log(`📡 WebSocket server ready for real-time live events`);
  console.log(`🌐 Environment: ${ENV.NODE_ENV}`);
  console.log(`=======================================================`);
  await ensureInitialData();
});

export { app, httpServer, io };
