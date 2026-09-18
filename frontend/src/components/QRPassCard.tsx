import React, { useState } from 'react';
import { Download, Printer, Users, UserCheck, ShieldCheck, IdCard, Mail, Phone, ChevronRight } from 'lucide-react';
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

  const schoolColor = team.school.color_code || team.school.colorCode || '#2563EB';
  const theme = getSchoolTheme(team.school.code, schoolColor);

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedParticipant = participants[selectedMemberIdx] || participants[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden max-w-xl mx-auto my-4 transition-all">
      
      {/* Official University & Club Header Strip */}
      <div className="bg-white px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src="/images/Presidency.png"
            alt="Presidency University"
            className="h-7 w-auto object-contain"
          />
        </div>

        <div className="flex items-center space-x-3">
          <img
            src="/images/DSA NAAC.png"
            alt="NAAC A"
            className="h-6 w-auto object-contain hidden sm:block"
          />
          <img
            src="/images/iiclogo.png"
            alt="IIC"
            className="h-6 w-auto object-contain hidden sm:block"
          />
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <img
            src="/images/CogniCore Logo.png"
            alt="CogniCore Club"
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/90 p-1.5 gap-1.5">
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

      {/* Team Pass View */}
      {activeTab === 'team' && (
        <div>
          {/* School Color Header Banner */}
          <div
            className="p-6 text-white relative overflow-hidden transition-colors"
            style={{ backgroundColor: schoolColor }}
          >
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{team.school.code} • {team.school.name}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{team.teamName}</h2>
                <p className="text-xs sm:text-sm text-white/90 font-medium mt-0.5">
                  {team.event?.name || 'CogniCore University Event'}
                </p>
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

            {/* Subtle watermark */}
            <div className="absolute -right-6 -bottom-8 opacity-10 text-8xl font-black select-none pointer-events-none">
              {team.school.code}
            </div>
          </div>

          {/* Team Body */}
          <div className="p-6 text-center">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 inline-block mb-4 shadow-inner">
              <img
                src={teamQrDataUrl}
                alt="Team QR Code"
                className="w-56 h-56 mx-auto rounded-xl shadow-sm border border-slate-200"
              />
            </div>

            <div className="font-mono text-sm font-bold text-slate-800 tracking-wider">
              {team.qrToken}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              One-scan check-in for all {team.teamSize} team members at the registration entrance
            </p>

            {/* Quick Actions */}
            <div className="flex items-center justify-center space-x-3 mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={() =>
                  downloadImage(teamQrDataUrl, `team-pass-${team.teamName.replace(/\s+/g, '_')}.png`)
                }
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Pass</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Pass View (Exact Same Rich Card Layout as Team Pass) */}
      {activeTab === 'individual' && selectedParticipant && (
        <div>
          {/* Member Selector Pills if multiple members */}
          {participants.length > 1 && (
            <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto">
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
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  Member {idx + 1}: {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          {/* School Color Header Banner for Individual Student */}
          <div
            className="p-6 text-white relative overflow-hidden transition-colors"
            style={{ backgroundColor: schoolColor }}
          >
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{team.school.code} • {team.school.name}</span>
                  </span>

                  {(selectedParticipant.rollNumber || selectedParticipant.roll_number) && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black tracking-wider uppercase shadow-sm">
                      <IdCard className="w-3.5 h-3.5" />
                      <span>{selectedParticipant.rollNumber || selectedParticipant.roll_number}</span>
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {selectedParticipant.name}
                </h2>
                <p className="text-xs sm:text-sm text-white/90 font-medium mt-0.5">
                  Team: <strong className="text-white">{team.teamName}</strong> • {team.event?.name || 'CogniCore Club'}
                </p>
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

            {/* Subtle watermark */}
            <div className="absolute -right-6 -bottom-8 opacity-10 text-8xl font-black select-none pointer-events-none">
              PU
            </div>
          </div>

          {/* Individual Body */}
          <div className="p-6 text-center">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 inline-block mb-4 shadow-inner">
              {selectedParticipant.qrDataUrl ? (
                <img
                  src={selectedParticipant.qrDataUrl}
                  alt={`${selectedParticipant.name} QR Pass`}
                  className="w-56 h-56 mx-auto rounded-xl shadow-sm border border-slate-200"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                  Individual QR Available
                </div>
              )}
            </div>

            <div className="font-mono text-sm font-bold text-slate-800 tracking-wider">
              {selectedParticipant.qrToken}
            </div>

            {/* Student metadata badges */}
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

            {/* Actions for this individual pass */}
            <div className="flex items-center justify-center space-x-3 mt-6 pt-6 border-t border-slate-100">
              {selectedParticipant.qrDataUrl && (
                <button
                  onClick={() =>
                    downloadImage(
                      selectedParticipant.qrDataUrl!,
                      `pass-${selectedParticipant.name.replace(/\s+/g, '_')}.png`
                    )
                  }
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Pass</span>
                </button>
              )}

              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
