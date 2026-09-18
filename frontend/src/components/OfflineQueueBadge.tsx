import React, { useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { OfflineScanItem } from '../types';
import { removeOfflineScan } from '../utils/offlineQueue';

interface OfflineQueueBadgeProps {
  queue: OfflineScanItem[];
  onSyncComplete: () => void;
}

export const OfflineQueueBadge: React.FC<OfflineQueueBadgeProps> = ({ queue, onSyncComplete }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (queue.length === 0 && !syncMessage) {
    return null;
  }

  const handleSync = async () => {
    if (queue.length === 0) return;
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const payload = queue.map((q) => ({
        qrToken: q.qrToken,
        scanType: q.scanType,
        scannedAt: q.timestamp,
      }));

      const res = await api.syncOfflineScans(payload);

      // Remove synced items
      queue.forEach((item) => removeOfflineScan(item.id));

      setSyncMessage(res.message);
      onSyncComplete();
      setTimeout(() => setSyncMessage(null), 6000);
    } catch (err: any) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 shadow-sm mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">
              Offline Queue ({queue.length} pending)
            </h4>
            <p className="text-xs text-amber-700">
              Scans are stored safely locally to prevent data loss.
            </p>
          </div>
        </div>

        {queue.length > 0 && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        )}
      </div>

      {syncMessage && (
        <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center space-x-2 text-xs text-amber-900 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}
    </div>
  );
};
