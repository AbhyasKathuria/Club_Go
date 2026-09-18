const API_BASE = '/api';

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
  updateSchool: (id: string, data: { name?: string; color_code: string }) =>
    request<any>(`/schools/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
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

  // Downloads
  getExcelDownloadUrl: () => `${API_BASE}/export/excel`,
  getSnapshotDownloadUrl: () => `${API_BASE}/backup/snapshot`,
};
