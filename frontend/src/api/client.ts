const BACKEND_URL = ((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/+$/, '');
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('clubgo_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('clubgo_token', token);
  } else {
    localStorage.removeItem('clubgo_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type if FormData (e.g. for uploads)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.details && Array.isArray(errorData.details)) {
        errorMsg = errorData.details
          .map((d: any) => `${d.path.replace('participants.', 'Member ')}: ${d.message}`)
          .join(' • ');
      } else {
        errorMsg = errorData.error || errorData.message || errorMsg;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return (await response.json()) as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getCurrentUser: () => request<{ user: any }>('/auth/me'),

  // Events
  getActiveEvent: () => request<{ event: any; schools: any[] }>('/events/active'),
  getAllEvents: () => request<any[]>('/events/all'),
  updateEvent: (id: string, data: any) =>
    request<any>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleEventStatus: (id: string, status: string) =>
    request<any>(`/events/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  uploadSponsorLogo: (id: string, formData: FormData) =>
    request<any>(`/events/${id}/upload-logo`, {
      method: 'POST',
      body: formData,
    }),

  // Schools
  getSchools: () => request<any[]>('/schools'),
  createSchool: (data: { name: string; code: string; color_code: string }) =>
    request<any>('/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSchool: (id: string, data: { name?: string; color_code: string }) =>
    request<any>(`/schools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSchool: (id: string) =>
    request<any>(`/schools/${id}`, {
      method: 'DELETE',
    }),

  // Student Co-ordinators
  registerCoordinator: (data: {
    name: string;
    username: string;
    roll_number: string;
    email: string;
    phone?: string;
    school_name?: string;
  }) =>
    request<any>('/auth/coordinator/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  loginCoordinator: (credentials: { username: string; password?: string; roll_number?: string }) =>
    request<{ token: string; user: any }>('/auth/coordinator/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getCoordinators: () => request<any[]>('/coordinators'),
  approveCoordinator: (id: string) =>
    request<any>(`/coordinators/${id}/approve`, {
      method: 'PATCH',
    }),
  revokeCoordinator: (id: string) =>
    request<any>(`/coordinators/${id}/revoke`, {
      method: 'PATCH',
    }),
  deleteCoordinator: (id: string) =>
    request<any>(`/coordinators/${id}`, {
      method: 'DELETE',
    }),
  createCoordinator: (data: any) =>
    request<any>('/coordinators', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Results & Certificates
  getPublicResults: () => request<{ event: any; results: any[] }>('/results/public'),
  unlockTeamResults: (teamName: string) =>
    request<any>('/results/unlock', {
      method: 'POST',
      body: JSON.stringify({ teamName }),
    }),
  getAdminResults: () => request<{ event: any; teams: any[] }>('/results/admin'),
  saveTeamResult: (data: {
    eventId: string;
    teamId: string;
    rank?: number | null;
    awardTitle: string;
    remarks?: string;
    isPublished: boolean;
    customCertificateUrl?: string | null;
    memberCertificates?: Array<{ participantId: string; certificateUrl?: string | null }>;
  }) =>
    request<any>('/results', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  togglePublishResult: (id: string, isPublished: boolean) =>
    request<any>(`/results/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished }),
    }),
  deleteResult: (id: string) =>
    request<any>(`/results/${id}`, {
      method: 'DELETE',
    }),

  // Registrations
  registerTeam: (data: any) =>
    request<any>('/registrations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getConfirmation: (teamId: string) =>
    request<any>(`/registrations/confirmation/${teamId}`),
  softDeleteTeam: (teamId: string) =>
    request<any>('/registrations/soft-delete', {
      method: 'POST',
      body: JSON.stringify({ teamId, confirmation: true }),
    }),

  // Attendance
  scanQR: (payload: { qrToken: string; scanType?: 'team' | 'individual' }) =>
    request<any>('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  syncOfflineScans: (scans: any[]) =>
    request<any>('/attendance/sync-offline', {
      method: 'POST',
      body: JSON.stringify({ scans }),
    }),
  getLiveDashboard: () => request<any>('/attendance/live-dashboard'),

  // Downloads & Exports
  getExcelDownloadUrl: (eventId?: string) => {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    if (token) params.append('token', token);
    const qs = params.toString();
    return `${API_BASE}/export/excel${qs ? `?${qs}` : ''}`;
  },
  getSnapshotDownloadUrl: () => {
    const token = getAuthToken();
    return token ? `${API_BASE}/backup/snapshot?token=${encodeURIComponent(token)}` : `${API_BASE}/backup/snapshot`;
  },
  downloadExcelReport: async (eventId?: string) => {
    const token = getAuthToken();
    const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
    const res = await fetch(`${API_BASE}/export/excel${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || `Excel export failed (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition');
    let filename = `ClubGo_Attendance_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  downloadDatabaseSnapshot: async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/backup/snapshot`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || `Backup download failed (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    const contentDisposition = res.headers.get('Content-Disposition');
    let filename = `clubgo_snapshot_${new Date().toISOString().slice(0, 10)}.json`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
