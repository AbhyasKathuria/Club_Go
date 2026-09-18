import ExcelJS from 'exceljs';
import { prisma } from '../config/database';

export async function generateAttendanceExcelReport(eventId?: string): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CogniCore Club • Presidency University';
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
      event: true,
      participants: {
        where: { is_deleted: false },
        orderBy: { created_at: 'asc' },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  // Collect all participants with their team info
  const allParticipants = teams.flatMap((team) =>
    team.participants.map((p, idx) => ({
      ...p,
      memberIndex: idx + 1,
      isLeader: idx === 0,
      team,
    }))
  );

  const totalTeams = teams.length;
  const totalParticipants = allParticipants.length;
  const checkedInParticipants = allParticipants.filter((p) => p.attendance_status === 'CHECKED_IN').length;
  const attendanceRate = totalParticipants > 0 ? ((checkedInParticipants / totalParticipants) * 100).toFixed(1) : '0.0';

  const maxTeamMembers = teams.reduce((max, t) => Math.max(max, t.participants.length), 0) || 1;

  // Helper to safely parse custom_fields JSON
  const parseCustomFields = (customStr: string | null | undefined): Record<string, any> => {
    if (!customStr) return {};
    try {
      return typeof customStr === 'string' ? JSON.parse(customStr) : customStr;
    } catch {
      return {};
    }
  };

  // -------------------------------------------------------------
  // Sheet 1: Master Registrations (Participant-Level with Full Form Details)
  // -------------------------------------------------------------
  const masterSheet = workbook.addWorksheet('Master Registrations', {
    views: [{ showGridLines: true }],
  });

  masterSheet.columns = [
    { header: 'Team Name', key: 'team_name', width: 26 },
    { header: 'School Code', key: 'school_code', width: 14 },
    { header: 'School Name', key: 'school_name', width: 34 },
    { header: 'Team Leader Contact', key: 'leader_phone', width: 22 },
    { header: 'Member Role', key: 'role', width: 16 },
    { header: 'Participant Full Name', key: 'name', width: 28 },
    { header: 'University Roll Number', key: 'roll_number', width: 24 },
    { header: 'Campus Email', key: 'email', width: 34 },
    { header: 'Contact Phone', key: 'phone', width: 18 },
    { header: 'Semester / Year', key: 'semester', width: 18 },
    { header: 'Class & Section', key: 'section', width: 18 },
    { header: 'Other Form Details', key: 'other_custom', width: 32 },
    { header: 'Attendance Status', key: 'status', width: 20 },
    { header: 'Check-In Timestamp', key: 'checkin_time', width: 24 },
    { header: 'Team Express Token', key: 'team_token', width: 26 },
    { header: 'Member Pass Token', key: 'member_token', width: 26 },
    { header: 'Registered Timestamp', key: 'created_at', width: 24 },
  ];

  // Style Header Row
  const masterHeader = masterSheet.getRow(1);
  masterHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  masterHeader.height = 26;
  masterHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // Dark slate
  };
  masterHeader.alignment = { vertical: 'middle', horizontal: 'center' };

  allParticipants.forEach((p, rowIdx) => {
    const custom = parseCustomFields(p.custom_fields);

    // Extract any extra custom form questions
    const extraCustomEntries = Object.entries(custom)
      .filter(([k]) => !['semester', 'section', 'personal_email'].includes(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');

    const row = masterSheet.addRow({
      team_name: p.team.team_name,
      school_code: p.team.school.code,
      school_name: p.team.school.name,
      leader_phone: p.team.leader_phone || p.team.participants[0]?.phone || 'N/A',
      role: p.isLeader ? '★ Team Leader' : `Member ${p.memberIndex}`,
      name: p.name,
      roll_number: p.roll_number || 'N/A',
      email: p.university_email,
      phone: p.phone || 'N/A',
      semester: custom.semester || 'N/A',
      section: custom.section || 'N/A',
      other_custom: extraCustomEntries || 'N/A',
      status: p.attendance_status === 'CHECKED_IN' ? 'CHECKED IN' : 'NOT ATTENDED',
      checkin_time: p.checked_in_at ? new Date(p.checked_in_at).toLocaleString() : 'N/A',
      team_token: p.team.qr_token,
      member_token: p.qr_code_token,
      created_at: new Date(p.team.created_at).toLocaleString(),
    });

    row.height = 20;
    row.alignment = { vertical: 'middle' };

    // Alternate row zebra striping
    if (rowIdx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' }, // subtle slate-50
      };
    }

    // Attendance cell styling
    const statusCell = row.getCell('status');
    if (p.attendance_status === 'CHECKED_IN') {
      statusCell.font = { bold: true, color: { argb: 'FF047857' } }; // emerald
    } else {
      statusCell.font = { color: { argb: 'FF64748B' } }; // slate
    }
  });

  // -------------------------------------------------------------
  // Sheet 2: Teams & Members Roster (Team-Centric Row Layout)
  // -------------------------------------------------------------
  const teamsSheet = workbook.addWorksheet('Teams & Members Roster', {
    views: [{ showGridLines: true }],
  });

  // Base team columns
  const teamColumns: any[] = [
    { header: 'Team Name', key: 'team_name', width: 26 },
    { header: 'School', key: 'school', width: 14 },
    { header: 'Team Size', key: 'size', width: 12 },
    { header: 'Leader Phone', key: 'leader_phone', width: 18 },
    { header: 'Team Status', key: 'team_status', width: 18 },
    { header: 'Check-In Timestamp', key: 'checkin_time', width: 24 },
    { header: 'Team QR Token', key: 'qr_token', width: 26 },
    { header: 'Registered Timestamp', key: 'registered_at', width: 24 },
    { header: 'All Members Summary', key: 'members_summary', width: 45 },
  ];

  // Dynamically add columns for Member 1 (Leader), Member 2, etc.
  for (let m = 1; m <= maxTeamMembers; m++) {
    const label = m === 1 ? 'Leader' : `Member ${m}`;
    teamColumns.push(
      { header: `${label} Name`, key: `m${m}_name`, width: 24 },
      { header: `${label} Roll No`, key: `m${m}_roll`, width: 20 },
      { header: `${label} Email`, key: `m${m}_email`, width: 30 },
      { header: `${label} Phone`, key: `m${m}_phone`, width: 18 },
      { header: `${label} Semester`, key: `m${m}_sem`, width: 16 },
      { header: `${label} Section`, key: `m${m}_sec`, width: 16 },
      { header: `${label} Attendance`, key: `m${m}_status`, width: 16 }
    );
  }

  teamsSheet.columns = teamColumns;

  // Style Header Row
  const teamsHeader = teamsSheet.getRow(1);
  teamsHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  teamsHeader.height = 26;
  teamsHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1D4ED8' }, // Blue
  };
  teamsHeader.alignment = { vertical: 'middle', horizontal: 'center' };

  teams.forEach((t, rowIdx) => {
    const membersSummary = t.participants
      .map(
        (m, idx) =>
          `${idx + 1}. ${m.name} (${m.roll_number || 'No Roll'}) [${
            m.attendance_status === 'CHECKED_IN' ? 'Present' : 'Pending'
          }]`
      )
      .join(' | ');

    const rowData: Record<string, any> = {
      team_name: t.team_name,
      school: `${t.school.code}`,
      size: t.team_size,
      leader_phone: t.leader_phone || t.participants[0]?.phone || 'N/A',
      team_status: t.checked_in ? 'CHECKED IN' : 'PENDING',
      checkin_time: t.checked_in_at ? new Date(t.checked_in_at).toLocaleString() : 'N/A',
      qr_token: t.qr_token,
      registered_at: new Date(t.created_at).toLocaleString(),
      members_summary: membersSummary,
    };

    // Populate each member's form details
    for (let m = 1; m <= maxTeamMembers; m++) {
      const participant = t.participants[m - 1];
      if (participant) {
        const custom = parseCustomFields(participant.custom_fields);
        rowData[`m${m}_name`] = participant.name;
        rowData[`m${m}_roll`] = participant.roll_number || 'N/A';
        rowData[`m${m}_email`] = participant.university_email;
        rowData[`m${m}_phone`] = participant.phone || 'N/A';
        rowData[`m${m}_sem`] = custom.semester || 'N/A';
        rowData[`m${m}_sec`] = custom.section || 'N/A';
        rowData[`m${m}_status`] = participant.attendance_status === 'CHECKED_IN' ? 'CHECKED IN' : 'PENDING';
      } else {
        rowData[`m${m}_name`] = '-';
        rowData[`m${m}_roll`] = '-';
        rowData[`m${m}_email`] = '-';
        rowData[`m${m}_phone`] = '-';
        rowData[`m${m}_sem`] = '-';
        rowData[`m${m}_sec`] = '-';
        rowData[`m${m}_status`] = '-';
      }
    }

    const row = teamsSheet.addRow(rowData);
    row.height = 20;
    row.alignment = { vertical: 'middle' };

    if (rowIdx % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      };
    }
  });

  // -------------------------------------------------------------
  // Sheet 3: Overview & Analytics
  // -------------------------------------------------------------
  const summarySheet = workbook.addWorksheet('Overview & Analytics', {
    views: [{ showGridLines: true }],
  });

  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 38 },
    { header: 'Value', key: 'value', width: 30 },
  ];

  const summaryHeader = summarySheet.getRow(1);
  summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summaryHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };

  summarySheet.addRow({ metric: 'Total Registered Teams', value: totalTeams });
  summarySheet.addRow({ metric: 'Total Registered Participants', value: totalParticipants });
  summarySheet.addRow({ metric: 'Total Checked In (Present)', value: checkedInParticipants });
  summarySheet.addRow({ metric: 'Overall Turnout Rate', value: `${attendanceRate}%` });
  summarySheet.addRow({ metric: 'Report Generated At', value: new Date().toISOString() });

  summarySheet.addRow({});
  summarySheet.addRow({ metric: 'SCHOOL-BY-SCHOOL TURNOUT BREAKDOWN', value: '' });
  summarySheet.getRow(7).font = { bold: true, color: { argb: 'FF0F172A' } };

  summarySheet.addRow({
    metric: 'School Name (Code)',
    value: 'Turnout (Present / Total)',
  });
  summarySheet.getRow(8).font = { bold: true };

  schools.forEach((s) => {
    const schoolParts = allParticipants.filter((p) => p.team.school_id === s.id);
    const schoolPresent = schoolParts.filter((p) => p.attendance_status === 'CHECKED_IN').length;
    const pct = schoolParts.length > 0 ? ((schoolPresent / schoolParts.length) * 100).toFixed(1) : '0';

    summarySheet.addRow({
      metric: `${s.name} (${s.code})`,
      value: `${schoolPresent} / ${schoolParts.length} (${pct}%)`,
    });
  });

  return workbook;
}
