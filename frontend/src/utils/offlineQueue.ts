import { OfflineScanItem } from '../types';

const STORAGE_KEY = 'clubgo_offline_scans_queue';

export function getOfflineQueue(): OfflineScanItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read offline scans queue:', e);
    return [];
  }
}

export function saveOfflineQueue(items: OfflineScanItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save offline scans queue:', e);
  }
}

export function enqueueOfflineScan(
  qrToken: string,
  scanType: 'team' | 'individual'
): OfflineScanItem {
  const queue = getOfflineQueue();
  const newItem: OfflineScanItem = {
    id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    qrToken,
    scanType,
    timestamp: new Date().toISOString(),
    status: 'PENDING',
  };

  queue.push(newItem);
  saveOfflineQueue(queue);
  return newItem;
}

export function removeOfflineScan(id: string): void {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  saveOfflineQueue(queue);
}

export function clearSyncedScans(): void {
  const queue = getOfflineQueue().filter((item) => item.status === 'PENDING');
  saveOfflineQueue(queue);
}
