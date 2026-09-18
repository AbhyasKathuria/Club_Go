import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import { api } from '../../api/client';
import { PublicResultEntry, UnlockedResult, Certificate } from '../../types';
import {
  Trophy,
  Award,
  Search,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Download,
  Printer,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  X,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';

export const ResultsPublicPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<PublicResultEntry[]>([]);
  const [eventName, setEventName] = useState('ClubGo Tech & Innovation Summit');
  const [isLoading, setIsLoading] = useState(true);
  const [teamSearch, setTeamSearch] = useState('');
  const [unlockedData, setUnlockedData] = useState<UnlockedResult | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Certificate Viewer Modal
  const [viewingCert, setViewingCert] = useState<Certificate | null>(null);
  const [certQrUrl, setCertQrUrl] = useState<string>('');

  useEffect(() => {
    async function fetchPublicResults() {
      try {
        const res = await api.getPublicResults();
        setLeaderboard(res.results || []);
        if (res.event?.name) setEventName(res.event.name);
      } catch (err) {
        console.error('Failed to load public results:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPublicResults();
  }, []);

  const handleUnlockTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamSearch.trim()) return;

    setIsUnlocking(true);
    setUnlockError(null);

    try {
      const res = await api.unlockTeamResults(teamSearch.trim());
      setUnlockedData(res);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#F59E0B', '#2563EB', '#10B981', '#EF4444'],
      });
    } catch (err: any) {
      setUnlockError(err.message || 'No published results found for this team name.');
      setUnlockedData(null);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleOpenCertificate = async (cert: Certificate) => {
    setViewingCert(cert);
    try {
      const url = await QRCode.toDataURL(
        `CLUBGO-VERIFY:${cert.certificateNo}:${cert.recipientName}:${unlockedData?.team.teamName}`,
        { width: 140, margin: 1, color: { dark: '#0F172A', light: '#FFFFFF' } }
      );
      setCertQrUrl(url);
    } catch (err) {
      console.error('Failed to generate QR for cert:', err);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <img src="/images/Presidency.png" alt="Presidency University" className="h-8 w-auto object-contain" />
          <div className="h-5 w-px bg-slate-200" />
          <img src="/images/DSA NAAC.png" alt="NAAC A+" className="h-8 w-auto object-contain" />
          <div className="h-5 w-px bg-slate-200" />
          <img src="/images/CogniCore Logo.png" alt="CogniCore Club" className="h-9 w-auto object-contain" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Official Event Standings & Certificates</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {eventName}
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Tournament outcomes are publicly displayed with anonymous credentials. To access your team's achievement rank and download your official verifiable certificates, enter your registered Team Name below.
        </p>
      </div>

      {/* Team Unlock Search Box */}
      <div className="max-w-2xl mx-auto bg-gradient-to-b from-white to-slate-50 rounded-2xl border-2 border-amber-200/80 p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-sm mb-4">
          <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
            <Unlock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Unlock Individual Certificates</h2>
            <p className="text-xs text-slate-500 font-normal">
              Enter your registered Team Name or University Email
            </p>
          </div>
        </div>

        <form onSubmit={handleUnlockTeam} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="e.g. Binary Titans, Xsparks, or student@university.edu"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isUnlocking}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isUnlocking ? 'Verifying...' : 'Unlock Certificates'}</span>
            </button>
          </div>

          {unlockError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{unlockError}</span>
            </div>
          )}
        </form>
      </div>

      {/* Unlocked Team Results & Certificate Cards */}
      {unlockedData && (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Achievement Banner */}
          <div
            className="p-6 rounded-2xl text-white shadow-lg space-y-2 relative overflow-hidden"
            style={{ backgroundColor: unlockedData.team.school.color_code || '#2563EB' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black tracking-wider uppercase">
                  {unlockedData.team.school.code} • {unlockedData.team.school.name}
                </span>
                {unlockedData.result.rank && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-xs font-black">
                    Rank #{unlockedData.result.rank}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-white/80">
                Team Size: {unlockedData.team.teamSize}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {unlockedData.team.teamName}
            </h2>
            <div className="text-base sm:text-lg font-bold text-white/95">
              🏆 {unlockedData.result.awardTitle}
            </div>
            {unlockedData.result.remarks && (
              <p className="text-xs text-white/80 italic mt-1">
                "{unlockedData.result.remarks}"
              </p>
            )}
          </div>

          {/* Member Certificates Grid */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Individual Verifiable Certificates ({unlockedData.certificates.length})</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {unlockedData.certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-amber-300 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        {cert.certificateNo}
                      </span>
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    </div>

                    {/* PNG Certificate Preview Thumbnail */}
                    {cert.certificateUrl ? (
                      <div
                        onClick={() => handleOpenCertificate(cert)}
                        className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-32 flex items-center justify-center cursor-pointer group relative shadow-inner"
                      >
                        <img
                          src={cert.certificateUrl}
                          alt={`Certificate for ${cert.recipientName}`}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center text-white text-xs font-bold space-x-1.5 opacity-90 group-hover:opacity-100">
                          <Eye className="w-4 h-4 text-amber-400" />
                          <span>Click to View Full PNG</span>
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <div className="text-base font-black text-slate-900">
                        {cert.recipientName}
                      </div>

                      <div className="text-xs font-semibold text-amber-600 mt-0.5">
                        {cert.awardTitle}
                      </div>

                      {cert.participant?.email && (
                        <div className="text-[11px] text-slate-500 font-mono mt-1">
                          {cert.participant.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenCertificate(cert)}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>{cert.certificateUrl ? 'View & Download PNG Certificate' : 'View & Download Certificate'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Public Anonymous Leaderboard */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Published Leaderboard & Outcomes
            </h2>
            <p className="text-xs text-slate-500">
              Public view (Member identities redacted for confidentiality)
            </p>
          </div>

          <div className="text-xs font-bold text-slate-400 flex items-center space-x-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Anonymous Mode</span>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-400 text-sm">
            No event results have been published yet. Please check back after the evaluation ceremony!
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {leaderboard.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-black text-sm flex items-center justify-center flex-shrink-0">
                      {item.rank ? `#${item.rank}` : `•`}
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                        <span>{item.awardTitle}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.school.color_code }}
                        />
                        <span className="font-semibold">{item.school.code}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">Team: [Unlocked via Search]</span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-auto">
                    <button
                      onClick={() => {
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Unlock with Team Name</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Official Printable Certificate Modal */}
      {viewingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
            
            {/* Modal Actions */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Official Verifiable Certificate • Presidency University
              </span>

              <div className="flex items-center space-x-2">
                {viewingCert.certificateUrl && (
                  <a
                    href={viewingCert.certificateUrl}
                    download={`Certificate_${viewingCert.recipientName.replace(/\s+/g, '_')}.png`}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </a>
                )}

                <button
                  onClick={handlePrintCertificate}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  onClick={() => setViewingCert(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* If Custom PNG Certificate is Uploaded by Admin */}
            {viewingCert.certificateUrl ? (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-950 flex items-center justify-center p-2 sm:p-3">
                  <img
                    src={viewingCert.certificateUrl}
                    alt={`Certificate for ${viewingCert.recipientName}`}
                    className="w-full h-auto max-h-[70vh] object-contain rounded-xl shadow-lg"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 text-xs font-sans">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-500 uppercase">{viewingCert.certificateNo}</span>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Official Presidential Issue</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Presidency University • CogniCore Club
                  </div>
                </div>
              </div>
            ) : (
              /* Printable Certificate Sheet */
              <div className="p-8 sm:p-12 border-8 border-double border-amber-600/60 bg-gradient-to-b from-amber-50/20 via-white to-amber-50/10 rounded-xl relative text-center space-y-6 font-serif">
                
                {/* University Emblem Strip */}
                <div className="flex items-center justify-between px-4">
                  <img src="/images/Presidency.png" alt="Presidency University" className="h-10 sm:h-12 w-auto object-contain" />
                  <div className="text-center font-sans">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                      Government of Karnataka State University
                    </div>
                    <div className="text-xs font-black tracking-tight text-slate-900">
                      PRESIDENCY UNIVERSITY, BENGALURU
                    </div>
                  </div>
                  <img src="/images/CogniCore Logo.png" alt="CogniCore Club" className="h-11 sm:h-14 w-auto object-contain" />
                </div>

                <div className="space-y-1 pt-2">
                  <div className="text-[11px] uppercase tracking-widest text-amber-700 font-sans font-bold">
                    Department of Student Affairs • CogniCore Club
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase font-sans">
                    Certificate of Achievement
                  </h1>
                  <div className="w-20 h-1 bg-amber-500 mx-auto rounded-full mt-2" />
                </div>

                <div className="space-y-3 py-2">
                  <p className="text-xs text-slate-600 italic">
                    This is proudly presented to
                  </p>

                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-wide underline decoration-amber-400 underline-offset-8">
                    {viewingCert.recipientName}
                  </div>

                  <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed pt-3">
                    of team <span className="font-bold text-slate-800 font-sans">{unlockedData?.team.teamName}</span> representing{' '}
                    <span className="font-bold text-slate-800 font-sans">{unlockedData?.team.school.name}</span>, in recognition of securing{' '}
                    <span className="font-bold text-amber-700 font-sans">{viewingCert.awardTitle}</span> at the annual{' '}
                    <span className="font-bold text-slate-800 font-sans">{eventName}</span>.
                  </p>
                </div>

                {/* Signatures & Verifier QR */}
                <div className="pt-6 border-t border-slate-200/80 flex items-end justify-between text-left font-sans">
                  <div>
                    <div className="font-script text-lg text-slate-700 italic">Dr. Evelyn Reed</div>
                    <div className="h-px w-28 bg-slate-400 my-1" />
                    <div className="text-[10px] font-bold text-slate-700">Faculty Coordinator</div>
                    <div className="text-[9px] text-slate-400">Department of Student Affairs</div>
                  </div>

                  {certQrUrl && (
                    <div className="text-center">
                      <img src={certQrUrl} alt="Certificate QR" className="w-16 h-16 mx-auto" />
                      <div className="font-mono text-[8px] text-slate-400 mt-1">
                        {viewingCert.certificateNo}
                      </div>
                    </div>
                  )}

                  <div className="text-right">
                    <div className="font-script text-lg text-slate-700 italic">Alex Rivera</div>
                    <div className="h-px w-28 bg-slate-400 my-1 ml-auto" />
                    <div className="text-[10px] font-bold text-slate-700">Student Coordinator Lead</div>
                    <div className="text-[9px] text-slate-400">CogniCore Club</div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
