import { Router, Response } from 'express';
import { authenticateToken, requireFacultyOrAdmin, AuthRequest } from '../middleware/auth';
import { generateAttendanceExcelReport } from '../services/excelService';

const router = Router();

// GET /api/export/excel - Download comprehensive attendance Excel workbook
router.get('/excel', authenticateToken, requireFacultyOrAdmin, async (req: AuthRequest, res: Response, next) => {
  try {
    const eventId = req.query.eventId as string | undefined;
    const workbook = await generateAttendanceExcelReport(eventId);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `ClubGo_Attendance_Report_${timestamp}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

export default router;
