import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, Printer, Users, UserCheck, ShieldCheck, IdCard, Mail, Phone, Loader2 } from 'lucide-react';
import { getSchoolTheme } from '../utils/themeHelper';

interface QRPassCardProps {
  team: {
    id: string;
    teamName: string;
    teamSize: number;
    qrToken: string;
    checkedIn?: boolean;
    school: {
      id: string;
      name: string;
      code: string;
      color_code?: string;
      colorCode?: string;
    };
    event?: {
      name: string;
      sponsor_name?: string;
      sponsor_logo_url?: string;
      event_date?: string;
    };
  };
  teamQrDataUrl: string;
  participants: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    rollNumber?: string;
    roll_number?: string;
    qrToken: string;
    qrDataUrl?: string;
    attendanceStatus?: string;
  }>;
}

export const QRPassCard: React.FC<QRPassCardProps> = ({ team, teamQrDataUrl, participants }) => {
  const [activeTab, setActiveTab] = useState<'team' | 'individual'>('team');
  const [selectedMemberIdx, setSelectedMemberIdx] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const schoolColor = team.school.color_code || team.school.colorCode || '#2563EB';
  const theme = getSchoolTheme(team.school.code, schoolColor);

  const selectedParticipant = participants[selectedMemberIdx] || participants[0];

  const handleDownloadStructuredPass = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const member = selectedParticipant;
      const filename =
        activeTab === 'team'
          ? `Pass_Team_${team.teamName.replace(/\s+/g, '_')}.png`
          : `Pass_${member.name.replace(/\s+/g, '_')}_${(member.rollNumber || member.roll_number || 'id').replace(/\s+/g, '_')}.png`;

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export structured pass card:', err);
      // Fallback: download QR directly
      const fallbackUrl =
        activeTab === 'team' ? teamQrDataUrl : (selectedParticipant.qrDataUrl || teamQrDataUrl);
      const link = document.createElement('a');
      link.href = fallbackUrl;
      link.download = `QR_${activeTab}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-4 transition-all">
      
      {/* Tab Switcher - Strictly marked no-print */}
      <div className="flex border border-slate-200 bg-slate-100/90 p-1.5 rounded-2xl gap-1.5 mb-4 no-print shadow-sm">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'team'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>Team Express Pass</span>
        </button>

        <button
          onClick={() => setActiveTab('individual')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'individual'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-indigo-600" />
          <span>Individual Passes ({participants.length})</span>
        </button>
      </div>

      {/* Member Selector Pills if multiple members - Strictly marked no-print */}
      {activeTab === 'individual' && participants.length > 1 && (
        <div className="mb-4 px-4 py-2.5 bg-white border border-slate-200 rounded-xl flex items-center space-x-2 overflow-x-auto no-print shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Select Member:
          </span>
          {participants.map((p, idx) => (
            <button
              key={p.id || idx}
              onClick={() => setSelectedMemberIdx(idx)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedMemberIdx === idx
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Member {idx + 1}: {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* THE ACTUAL STRUCTURED PASS CARD - DOWNLOADED AS PNG & PRINTED */}
      <div
        ref={cardRef}
        className="printable-pass-card bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden transition-all text-slate-900"
      >
        {/* Official University & Club Header Strip */}
        <div className="bg-white px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src="/images/Presidency.png"
              alt="Presidency University"
              className="h-7 w-auto object-contain"
            />
          </div>

          <div className="flex items-center space-x-2.5">
            <img
              src="/images/DSA NAAC.png"
              alt="NAAC A"
              className="h-6 w-auto object-contain"
            />
            <img
              src="/images/iiclogo.png"
              alt="IIC"
              className="h-6 w-auto object-contain"
            />
            <div className="h-5 w-px bg-slate-200" />
            <img
              src="/images/CogniCore Logo.png"
              alt="CogniCore Club"
              className="h-8 w-auto object-contain"
            />
          </div>
        </div>

        {/* School Color Header Banner (Explicit Inline Styles for Print & PNG Capture) */}
        <div
          className="p-6 text-white relative overflow-hidden transition-colors"
          style={{
            backgroundColor: schoolColor,
            color: '#ffffff',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          }}
        >
          {activeTab === 'team' ? (
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div
                  className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 text-white"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>{team.school.code} • {team.school.name}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  {team.teamName}
                </h2>
                <p className="text-xs sm:text-sm text-white font-medium mt-0.5">
                  Express Team Pass • {team.teamSize} Member{team.teamSize > 1 ? 's' : ''}
                </p>
                <div className="text-[11px] text-white/90 mt-1 font-medium">
                  {team.event?.name || 'CogniCore University Summit'}
                </div>
              </div>

              {team.event?.sponsor_logo_url && (
                <div className="bg-white p-1.5 rounded-xl shadow-sm max-w-[90px]">
                  <img
                    src={team.event.sponsor_logo_url}
                    alt="Sponsor"
                    className="max-h-8 object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span
                    className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    <span>{team.school.code} • {team.school.name}</span>
                  </span>

                  {(selectedParticipant.rollNumber || selectedParticipant.roll_number) && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black tracking-wider uppercase shadow-sm">
                      <IdCard className="w-3.5 h-3.5" />
                      <span>{selectedParticipant.rollNumber || selectedParticipant.roll_number}</span>
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  {selectedParticipant.name}
                </h2>
                <p className="text-xs sm:text-sm text-white font-medium mt-0.5">
                  Team: <strong className="text-white font-bold">{team.teamName}</strong>
                </p>
                <div className="text-[11px] text-white/90 mt-1 font-medium">
                  {team.event?.name || 'CogniCore Club'}
                </div>
              </div>

              {team.event?.sponsor_logo_url && (
                <div className="bg-white p-1.5 rounded-xl shadow-sm max-w-[90px]">
                  <img
                    src={team.event.sponsor_logo_url}
                    alt="Sponsor"
                    className="max-h-8 object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {/* Watermark */}
          <div
            className="absolute -right-6 -bottom-8 opacity-15 text-8xl font-black select-none pointer-events-none text-white"
            style={{ color: '#ffffff' }}
          >
            {team.school.code}
          </div>
        </div>

        {/* Card Body with Centered QR Code */}
        <div className="p-6 text-center bg-white">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block mb-3 shadow-inner">
            <img
              src={activeTab === 'team' ? teamQrDataUrl : (selectedParticipant.qrDataUrl || teamQrDataUrl)}
              alt="Pass QR Code"
              className="w-56 h-56 mx-auto rounded-xl shadow-sm border border-slate-200 bg-white"
            />
          </div>

          <div className="font-mono text-sm font-extrabold text-slate-900 tracking-wider">
            {activeTab === 'team' ? team.qrToken : selectedParticipant.qrToken}
          </div>

          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {activeTab === 'team'
              ? `One-scan express check-in for all ${team.teamSize} team members at the registration entrance`
              : 'Authorized individual pass for campus entry & attendance scanner check-in'}
          </p>

          {/* Participant details pills (for Individual pass) */}
          {activeTab === 'individual' && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
              {selectedParticipant.email && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 rounded-lg">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedParticipant.email}</span>
                </span>
              )}
              {selectedParticipant.phone && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 rounded-lg">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedParticipant.phone}</span>
                </span>
              )}
              {selectedParticipant.attendanceStatus === 'CHECKED_IN' && (
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold">
                  ✓ Present
                </span>
              )}
            </div>
          )}

          {/* Card footer strip */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Presidency University</span>
            <span>Official Digital Access Pass</span>
            <span>CogniCore Club</span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Strictly marked no-print */}
      <div className="flex items-center justify-center space-x-3 mt-5 no-print">
        <button
          onClick={handleDownloadStructuredPass}
          disabled={isDownloading}
          className="flex items-center space-x-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Pass Card...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Pass</span>
            </>
          )}
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center space-x-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print Card</span>
        </button>
      </div>

    </div>
  );
};
