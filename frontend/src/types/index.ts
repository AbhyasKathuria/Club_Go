export type Role = 'SUPERADMIN' | 'FACULTY' | 'VOLUNTEER';

export type EventStatus = 'DRAFT' | 'LAUNCHED' | 'CLOSED';

export type AttendanceStatus = 'NOT_ATTENDED' | 'CHECKED_IN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface School {
  id: string;
  name: string;
  code: string; // SOC, SOIS, SOD, SOCSE
  color_code: string; // #F59E0B, #38BDF8, #EF4444, #2563EB
  colorCode?: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  sponsor_name?: string;
  sponsor_logo_url?: string;
  event_date?: string;
  status: EventStatus;
  min_team_size: number;
  max_team_size: number;
  allowed_email_domain?: string | null;
  createdAt?: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  qrToken: string;
  attendanceStatus: AttendanceStatus;
  checkedInAt?: string | null;
  qrDataUrl?: string;
}

export interface Team {
  id: string;
  teamName: string;
  teamSize: number;
  qrToken: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
  createdAt?: string;
  school: School;
  participants: Participant[];
}

export interface SchoolStat {
  id: string;
  name: string;
  code: string;
  colorCode: string;
  totalTeams: number;
  totalParticipants: number;
  checkedInParticipants: number;
  attendancePercentage: string;
}

export interface DashboardOverview {
  totalTeams: number;
  checkedInTeams: number;
  totalParticipants: number;
  checkedInParticipants: number;
  attendancePercentage: string;
}

export interface LiveDashboardData {
  overview: DashboardOverview;
  schoolStats: SchoolStat[];
  teams: Team[];
}

export interface OfflineScanItem {
  id: string;
  qrToken: string;
  scanType: 'team' | 'individual';
  timestamp: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
}
