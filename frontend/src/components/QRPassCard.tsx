import React, { useState } from 'react';
import { Download, Printer, Users, UserCheck, ShieldCheck } from 'lucide-react';
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
    qrToken: string;
    qrDataUrl?: string;
    attendanceStatus?: string;
  }>;
}

export const QRPassCard: React.FC<QRPassCardProps> = ({ team, teamQrDataUrl, participants }) => {
  const [activeTab, setActiveTab] = useState<'team' | 'individual'>('team');
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden max-w-xl mx-auto">
      
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
            src="/images/iiclogo.png"
            alt="IIC"
            className="h-6 w-auto object-contain hidden sm:block"
          />
          <img
            src="/images/CogniCore Logo.png"
            alt="CogniCore Club"
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>

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
            <h2 className="text-2xl font-black tracking-tight">{team.teamName}</h2>
            <p className="text-sm text-white/90 font-medium mt-0.5">
              {team.event?.name || 'ClubGo University Summit'}
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

        {/* Diagonal subtle watermark */}
        <div className="absolute -right-6 -bottom-8 opacity-10 text-8xl font-black select-none pointer-events-none">
          {team.school.code}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5">
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'team'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
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
          <UserCheck className="w-4 h-4" />
          <span>Individual Passes ({participants.length})</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="p-6">
        {activeTab === 'team' ? (
          <div className="text-center">
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
              One-scan check-in for all {team.teamSize} team members at the registration desk
            </p>

            {/* Quick Actions */}
            <div className="flex items-center justify-center space-x-3 mt-6 pt-6 border-t border-slate-100">
              <button
                onClick={() =>
                  downloadImage(teamQrDataUrl, `team-pass-${team.teamName.replace(/\s+/g, '_')}.png`)
                }
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Pass</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Card</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {participants.map((p, idx) => (
              <div
                key={p.id || idx}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white shadow-sm"
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900">{p.name}</span>
                    {p.attendanceStatus === 'CHECKED_IN' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">
                        Present
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{p.email}</div>
                  <div className="font-mono text-[11px] text-slate-400">{p.qrToken}</div>
                </div>

                <div className="flex flex-col items-center flex-shrink-0">
                  {p.qrDataUrl && (
                    <img
                      src={p.qrDataUrl}
                      alt={p.name}
                      className="w-20 h-20 rounded-lg border border-slate-200 p-1 bg-white mb-2"
                    />
                  )}
                  {p.qrDataUrl && (
                    <button
                      onClick={() =>
                        downloadImage(p.qrDataUrl!, `pass-${p.name.replace(/\s+/g, '_')}.png`)
                      }
                      className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      <Download className="w-3 h-3" />
                      <span>Save QR</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
