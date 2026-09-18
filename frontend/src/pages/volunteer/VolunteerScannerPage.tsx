import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../../api/client';
import { soundEffects } from '../../utils/audioFeedback';
import { getOfflineQueue, enqueueOfflineScan } from '../../utils/offlineQueue';
import { OfflineQueueBadge } from '../../components/OfflineQueueBadge';
import { OfflineScanItem } from '../../types';
import {
  Camera,
  CameraOff,
  Users,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Keyboard,
  Clock,
  History,
  ShieldAlert,
} from 'lucide-react';

interface ScanResultCard {
  status: 'SUCCESS' | 'DUPLICATE' | 'INVALID';
  message: string;
  scanType?: string;
  timestamp?: string;
  data?: any;
}

export const VolunteerScannerPage: React.FC = () => {
  const [scanMode, setScanMode] = useState<'team' | 'individual'>('individual');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<ScanResultCard | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanHistory, setScanHistory] = useState<Array<{ token: string; status: string; time: string }>>([]);
  const [offlineQueue, setOfflineQueue] = useState<OfflineScanItem[]>(getOfflineQueue());

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTokenRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  // Load offline queue on mount
  useEffect(() => {
    setOfflineQueue(getOfflineQueue());
  }, []);

  const refreshQueue = () => {
    setOfflineQueue(getOfflineQueue());
  };

  // Start Camera Scanner
  const startScanner = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      const qrCodeSuccessCallback = (decodedText: string) => {
        // Prevent rapid duplicate fire within 2.5 seconds for same token
        const now = Date.now();
        if (
          decodedText === lastScannedTokenRef.current &&
          now - lastScannedTimeRef.current < 2500
        ) {
          return;
        }

        lastScannedTokenRef.current = decodedText;
        lastScannedTimeRef.current = now;

        handleTokenScanned(decodedText);
      };

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        qrCodeSuccessCallback,
        undefined
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Unable to access camera. Please ensure permissions are granted or use manual token input below.'
      );
      setIsScanning(false);
    }
  };

  // Stop Camera Scanner
  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (e) {
        console.error('Failed to stop scanner:', e);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Process a scanned token
  const handleTokenScanned = async (token: string) => {
    const cleanToken = token.trim();
    if (!cleanToken || isProcessing) return;

    setIsProcessing(true);

    // Auto-detect mode if token has clear prefix
    let effectiveMode = scanMode;
    if (cleanToken.startsWith('TEAM-')) effectiveMode = 'team';
    else if (cleanToken.startsWith('PART-')) effectiveMode = 'individual';

    try {
      const res = await api.scanQR({
        qrToken: cleanToken,
        scanType: effectiveMode,
      });

      if (res.status === 'SUCCESS') {
        soundEffects.playSuccess();
        setLatestResult({
          status: 'SUCCESS',
          message: res.message,
          scanType: res.scanType,
          timestamp: new Date().toLocaleTimeString(),
          data: res.data,
        });
      } else if (res.status === 'DUPLICATE') {
        soundEffects.playDuplicate();
        setLatestResult({
          status: 'DUPLICATE',
          message: res.message,
          scanType: res.scanType,
          timestamp: res.timestamp ? new Date(res.timestamp).toLocaleTimeString() : undefined,
          data: res.data,
        });
      }

      setScanHistory((prev) => [
        { token: cleanToken, status: res.status, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4),
      ]);
    } catch (err: any) {
      // Check if network failure or offline
      if (!navigator.onLine || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        // Enqueue offline scan
        enqueueOfflineScan(cleanToken, effectiveMode);
        refreshQueue();
        soundEffects.playSuccess(); // Optimistic feedback
        setLatestResult({
          status: 'SUCCESS',
          message: `Network offline: Scan queued locally (${cleanToken}). Will sync automatically when reconnected.`,
          scanType: effectiveMode.toUpperCase(),
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        // Server rejected (e.g. invalid QR)
        soundEffects.playInvalid();
        setLatestResult({
          status: 'INVALID',
          message: err.message || 'Invalid or unrecognized QR token',
          scanType: effectiveMode.toUpperCase(),
          timestamp: new Date().toLocaleTimeString(),
        });

        setScanHistory((prev) => [
          { token: cleanToken, status: 'INVALID', time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 4),
        ]);
      }
    } finally {
      setIsProcessing(false);
      setManualToken('');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      handleTokenScanned(manualToken.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      
      {/* Offline Alert Queue Badge */}
      <OfflineQueueBadge queue={offlineQueue} onSyncComplete={refreshQueue} />

      {/* Mode Switcher */}
      <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center mb-5 shadow-inner">
        <button
          onClick={() => setScanMode('individual')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            scanMode === 'individual'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Individual Scan</span>
        </button>

        <button
          onClick={() => setScanMode('team')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            scanMode === 'team'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Scan</span>
        </button>
      </div>

      {/* Camera Viewport Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isScanning ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {isScanning ? 'Scanner Active' : 'Camera Idle'}
            </span>
          </div>

          <button
            onClick={isScanning ? stopScanner : startScanner}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-colors ${
              isScanning
                ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isScanning ? (
              <>
                <CameraOff className="w-3.5 h-3.5" />
                <span>Stop Camera</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Start Camera</span>
              </>
            )}
          </button>
        </div>

        {/* Video stream canvas element */}
        <div className="relative bg-slate-900 min-h-[280px] flex items-center justify-center text-center p-4">
          <div id="qr-reader" className="w-full max-w-[320px]" />
          
          {!isScanning && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-900/90 text-white z-10">
              <Camera className="w-12 h-12 text-slate-400 mb-3" />
              <p className="text-sm font-semibold">Camera is stopped</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                Tap "Start Camera" above to scan attendee QR passes
              </p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-900/95 text-white z-10">
              <ShieldAlert className="w-10 h-10 text-amber-400 mb-2" />
              <p className="text-xs text-slate-300 max-w-xs">{cameraError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Instant Feedback Card */}
      {latestResult && (
        <div
          className={`p-4 rounded-2xl border mb-5 transition-all shadow-md ${
            latestResult.status === 'SUCCESS'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : latestResult.status === 'DUPLICATE'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="mt-0.5">
              {latestResult.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : latestResult.status === 'DUPLICATE' ? (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider">
                  {latestResult.status === 'SUCCESS'
                    ? 'Check-In Confirmed'
                    : latestResult.status === 'DUPLICATE'
                    ? 'Already Checked In (Duplicate)'
                    : 'Invalid QR Code'}
                </span>
                {latestResult.timestamp && (
                  <span className="text-[11px] opacity-75 font-mono">
                    {latestResult.timestamp}
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold mt-1">{latestResult.message}</p>

              {/* Extended Details */}
              {latestResult.data && (
                <div className="mt-2 pt-2 border-t border-black/10 text-xs space-y-0.5">
                  {latestResult.data.teamName && (
                    <div>Team: <span className="font-bold">{latestResult.data.teamName}</span></div>
                  )}
                  {latestResult.data.participantName && (
                    <div>Participant: <span className="font-bold">{latestResult.data.participantName}</span></div>
                  )}
                  {latestResult.data.school && (
                    <div>School: <span className="font-bold">{latestResult.data.school.code} - {latestResult.data.school.name}</span></div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Token Entry Fallback */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm mb-5">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          <Keyboard className="w-4 h-4 text-slate-500" />
          <span>Manual Code Entry Fallback</span>
        </div>

        <form onSubmit={handleManualSubmit} className="flex space-x-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder="e.g. TEAM-SOCSE-XXXX or PART-XXXX"
            className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
          />
          <button
            type="submit"
            disabled={!manualToken.trim() || isProcessing}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
          >
            Submit
          </button>
        </form>
      </div>

      {/* Recent Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            <History className="w-4 h-4 text-slate-500" />
            <span>Recent Scans in this Session</span>
          </div>

          <div className="space-y-2">
            {scanHistory.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center space-x-2 font-mono text-slate-700">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{h.token}</span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    h.status === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : h.status === 'DUPLICATE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
