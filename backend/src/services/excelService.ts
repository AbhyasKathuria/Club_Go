import ExcelJS from 'exceljs';
import { prisma } from '../config/database';

export async function generateAttendanceExcelReport(eventId?: string): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ClubGo University Platform';
  workbook.created = new Date();

  // 1. Fetch data
  const whereEvent = eventId ? { event_id: eventId, is_deleted: false } : { is_deleted: false };

  const schools = await prisma.school.findMany({
    orderBy: { code: 'asc' },
  });

  const teams = await prisma.team.findMany({
    where: whereEvent,
    include: {
      school: true,
      participants: {
        where: { is_deleted: false },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  const participants = await prisma.participant.findMany({
    where: {
      is_deleted: false,
      team: whereEvent,
    },
    include: {
      team: {
        include: {
          school: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const totalTeams = teams.length;
  const totalParticipants = participants.length;
  const checkedInParticipants = participants.filter((p) => p.attendance_status === 'CHECKED_IN').length;
  const attendanceRate = totalParticipants > 0 ? ((checkedInParticipants / totalParticipants) * 100).toFixed(1) : '0.0';

  // -------------------------------------------------------------
  // Sheet 1: Overview & Metrics
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet('Overview & Analytics', {
    views: [{ showGridLines: true }],
  });

  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 35 },
    { header: 'Value', key: 'value', width: 25 },
  ];

  summarySheet.addRow({ metric: 'Total Registered Teams', value: totalTeams });
  summarySheet.addRow({ metric: 'Total Registered Participants', value: totalParticipants });
  summarySheet.addRow({ metric: 'Total Checked In', value: checkedInParticipants });
  summarySheet.addRow({ metric: 'Overall Attendance Rate', value: `${attendanceRate}%` });
  summarySheet.addRow({ metric: 'Report Generated At', value: new Date().toISOString() });

  // Style Metric Header
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };

  summarySheet.addRow({});
  summarySheet.addRow({ metric: 'SCHOOL BREAKDOWN', value: '' });
  summarySheet.getRow(7).font = { bold: true, color: { argb: 'FF0F172A' } };

  summarySheet.addRow({
    metric: 'School Name (Code)',
    value: 'Attendance (Present / Total)',
  });
  summarySheet.getRow(8).font = { bold: true };

  schools.forEach((s) => {
    const schoolParts = participants.filter((p) => p.team.school_id === s.id);
    const schoolPresent = schoolParts.filter((p) => p.attendance_status === 'CHECKED_IN').length;
    const pct = schoolParts.length > 0 ? ((schoolPresent / schoolParts.length) * 100).toFixed(1) : '0';

    summarySheet.addRow({
      metric: `${s.name} (${s.code})`,
      value: `${schoolPresent} / ${schoolParts.length} (${pct}%)`,
    });
  });

  // -------------------------------------------------------------
  // Sheet 2: Teams Roster
  // -------------------------------------------------------------
  const teamsSheet = workbook.addWorksheet('Teams Roster', {
    views: [{ showGridLines: true }],
  });

  teamsSheet.columns = [
    { header: 'Team Name', key: 'name', width: 30 },
    { header: 'School', key: 'school', width: 15 },
    { header: 'Team Size', key: 'size', width: 12 },
    { header: 'Check-In Status', key: 'status', width: 18 },
    { header: 'Check-In Time', key: 'time', width: 24 },
    { header: 'Team QR Token', key: 'token', width: 28 },
    { header: 'Registered Date', key: 'date', width: 24 },
  ];

  teamsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  teamsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };

  teams.forEach((t) => {
    teamsSheet.addRow({
      name: t.team_name,
      school: `${t.school.code}`,
      size: t.team_size,
      status: t.checked_in ? 'CHECKED IN' : 'PENDING',
      time: t.checked_in_at ? new Date(t.checked_in_at).toLocaleString() : 'N/A',
      token: t.qr_token,
      date: new Date(t.created_at).toLocaleString(),
    });
  });

  // -------------------------------------------------------------
  // Sheet 3: Participants Attendance
  // -------------------------------------------------------------
  const partsSheet = workbook.addWorksheet('Participants Attendance', {
    views: [{ showGridLines: true }],
  });

  partsSheet.columns = [
    { header: 'Participant Name', key: 'name', width: 28 },
    { header: 'University Email', key: 'email', width: 32 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'School', key: 'school', width: 14 },
    { header: 'Team Name', key: 'team', width: 28 },
    { header: 'Attendance Status', key: 'status', width: 20 },
    { header: 'Check-In Timestamp', key: 'checkin_time', width: 24 },
    { header: 'Participant QR Token', key: 'token', width: 24 },
  ];

  partsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  partsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0D9488' },
  };

  participants.forEach((p) => {
    partsSheet.addRow({
      name: p.name,
      email: p.university_email,
      phone: p.phone,
      school: p.team.school.code,
      team: p.team.team_name,
      status: p.attendance_status === 'CHECKED_IN' ? 'CHECKED IN' : 'NOT ATTENDED',
      checkin_time: p.checked_in_at ? new Date(p.checked_in_at).toLocaleString() : 'N/A',
      token: p.qr_code_token,
    });
  });

  return workbook;
}
