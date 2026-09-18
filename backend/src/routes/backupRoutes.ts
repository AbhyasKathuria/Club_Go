import { Router, Response } from 'express';
import { authenticateToken, requireSuperAdmin, AuthRequest } from '../middleware/auth';
import { createDatabaseSnapshot } from '../services/backupService';

const router = Router();

// GET /api/backup/snapshot - Superadmin on-demand JSON database backup download
router.get('/snapshot', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const { timestamp, data } = await createDatabaseSnapshot();
    const filename = `clubgo_snapshot_${timestamp}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    next(err);
  }
});

export default router;
