import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Award,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  Eye,
  Trash2,
  X,
  FileText,
  Upload,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export const ResultsConfigTab: React.FC = () => {
  const [event, setEvent] = useState<any | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit / Award Modal
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [rank, setRank] = useState<number | ''>('');
  const [awardTitle, setAwardTitle] = useState('1st Place - Grand Champions');
  const [remarks, setRemarks] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [customCertUrl, setCustomCertUrl] = useState('');
  const [memberCerts, setMemberCerts] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadResults = async () => {
    try {
      const res = await api.getAdminResults();
      setEvent(res.event);
      setTeams(res.teams || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const openAwardModal = (team: any) => {
    setSelectedTeam(team);
    if (team.result) {
      setRank(team.result.rank ?? '');
      setAwardTitle(team.result.award_title || '1st Place - Grand Champions');
      setRemarks(team.result.remarks || '');
      setIsPublished(team.result.is_published);
    } else {
      setRank('');
      setAwardTitle('Certificate of Participation');
      setRemarks('');
      setIsPublished(true);
    }
    setCustomCertUrl('');

    // Pre-fill existing member certificate PNGs if available
    const initialCerts: Record<string, string> = {};
    if (team.result?.certificates) {
      team.result.certificates.forEach((c: any) => {
        if (c.certificate_url) {
          initialCerts[c.participant_id] = c.certificate_url;
        }
      });
    }
    setMemberCerts(initialCerts);
  };

  const handleMemberFileUpload = (participantId: string, file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, or WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setMemberCerts((prev) => ({
        ...prev,
        [participantId]: resultStr,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleBulkFileUpload = (file: File) => {
    if (!file || !selectedTeam) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, or WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const updated: Record<string, string> = {};
      selectedTeam.participants.forEach((p: any) => {
        updated[p.id] = resultStr;
      });
      setMemberCerts(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !event) return;

    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.saveTeamResult({
        eventId: event.id,
        teamId: selectedTeam.id,
        rank: rank === '' ? null : Number(rank),
        awardTitle: awardTitle.trim(),
        remarks: remarks.trim() || undefined,
        isPublished,
        customCertificateUrl: customCertUrl.trim() || null,
        memberCertificates: selectedTeam.participants.map((p: any) => ({
          participantId: p.id,
          certificateUrl: memberCerts[p.id] || null,
        })),
      });

      setMessage(res.message || 'Result and certificates updated.');
      setSelectedTeam(null);
      await loadResults();
    } catch (err: any) {
      setError(err.message || 'Failed to save result');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (resultId: string, currentStatus: boolean) => {
    setMessage(null);
    setError(null);
    try {
      const res = await api.togglePublishResult(resultId, !currentStatus);
      setMessage(res.message);
      await loadResults();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle publish status');
    }
  };

  const handleDeleteResult = async (resultId: string, teamName: string) => {
    if (!window.confirm(`Remove result and certificates for "${teamName}"?`)) return;
    setMessage(null);
    setError(null);
    try {
      const res = await api.deleteResult(resultId);
      setMessage(res.message);
      await loadResults();
    } catch (err: any) {
      setError(err.message || 'Failed to delete result');
    }
  };

  const filteredTeams = teams.filter((t) => {
    return (
      t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.school.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.result?.award_title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const awardedCount = teams.filter((t) => t.result).length;
  const publishedCount = teams.filter((t) => t.result?.is_published).length;

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading results and certificates...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" />
            <span>Tournament Outcomes & Awards</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Certificates & Results Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Assign team ranks, awards, and generate verifiable certificates for participants. Results display on the public leaderboard.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-bold">
            🏆 {awardedCount} / {teams.length} Teams Awarded
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold">
            📢 {publishedCount} Published
          </div>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Filter by team name, school, or award..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Teams Table */}
      <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Team & School</th>
                <th className="px-4 py-3">Roster</th>
                <th className="px-4 py-3">Rank & Award</th>
                <th className="px-4 py-3">Certificates Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No teams found matching search.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => {
                  const hasResult = !!team.result;
                  const isPub = team.result?.is_published;

                  return (
                    <tr key={team.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{team.teamName}</div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: team.school.color_code }}
                          />
                          <span className="text-[11px] font-semibold text-slate-500">
                            {team.school.code} • {team.school.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-slate-600 font-medium">
                          {team.participants.map((p: any) => p.name).join(', ')}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {team.teamSize} Member{team.teamSize > 1 ? 's' : ''}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {hasResult ? (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              {team.result.rank && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black">
                                  #{team.result.rank}
                                </span>
                              )}
                              <span>{team.result.award_title}</span>
                            </div>
                            {team.result.remarks && (
                              <div className="text-[11px] text-slate-400 italic mt-0.5 truncate max-w-xs">
                                "{team.result.remarks}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        {hasResult ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <FileText className="w-3 h-3" />
                              <span>{team.participants.length} Certs Issued</span>
                            </span>
                            <div>
                              {isPub ? (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-600">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Published to Portal</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-400">
                                  <span>Draft (Hidden)</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No certs issued</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openAwardModal(team)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          {hasResult ? 'Edit Award' : 'Issue Certs'}
                        </button>

                        {hasResult && (
                          <>
                            <button
                              onClick={() => handleTogglePublish(team.result.id, isPub)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                isPub
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {isPub ? 'Unpublish' : 'Publish'}
                            </button>

                            <button
                              onClick={() => handleDeleteResult(team.result.id, team.teamName)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete result"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Award & Certificate Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assign Award & Issue Certificates
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Team: <span className="font-bold text-slate-800">{selectedTeam.teamName}</span> ({selectedTeam.school.name})
                </p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResult} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rank / Position (Optional)
                  </label>
                  <input
                    type="number"
                    value={rank}
                    onChange={(e) => setRank(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 1, 2, 3"
                    min={1}
                    max={100}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Publish Status
                  </label>
                  <select
                    value={isPublished ? 'true' : 'false'}
                    onChange={(e) => setIsPublished(e.target.value === 'true')}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="true">Publish Immediately</option>
                    <option value="false">Save as Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Award Title / Honor
                </label>
                <input
                  type="text"
                  value={awardTitle}
                  onChange={(e) => setAwardTitle(e.target.value)}
                  placeholder="e.g. 1st Place - Grand Champions"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    '1st Place - Grand Champions',
                    '2nd Place - 1st Runner Up',
                    '3rd Place - 2nd Runner Up',
                    'Best Technical Innovation',
                    'Certificate of Participation',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAwardTitle(preset)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Citation / Jury Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Awarded for exceptional algorithmic architecture and zero-fault execution."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Individual Member PNG Certificates Section */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Individual Member PNG Certificates ({selectedTeam.participants.length})
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Attach a personalized PNG certificate image for each participant
                    </p>
                  </div>

                  <label className="self-start sm:self-auto px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center space-x-1.5 shadow-2xs">
                    <Upload className="w-3 h-3 text-blue-600" />
                    <span>Apply 1 PNG to All Members</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleBulkFileUpload(e.target.files[0]);
                      }}
                    />
                  </label>
                </div>

                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {selectedTeam.participants.map((p: any) => {
                    const certPng = memberCerts[p.id];
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-300 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs flex items-center space-x-2">
                            <span>{p.name}</span>
                            {certPng ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                <Check className="w-2.5 h-2.5" />
                                <span>PNG Attached</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-200 text-slate-600">
                                Default Template
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">{p.university_email}</div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {certPng ? (
                            <div className="flex items-center space-x-2">
                              <img
                                src={certPng}
                                alt={`Cert for ${p.name}`}
                                className="h-10 w-16 object-cover rounded-lg border border-slate-300 shadow-xs"
                              />
                              <label className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
                                Replace PNG
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) handleMemberFileUpload(p.id, e.target.files[0]);
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setMemberCerts((prev) => {
                                    const next = { ...prev };
                                    delete next[p.id];
                                    return next;
                                  });
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                                title="Remove PNG"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <label className="px-3 py-1.5 bg-white hover:bg-blue-50/70 text-blue-600 border border-blue-200 hover:border-blue-300 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center space-x-1.5 shadow-2xs">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Attach Member PNG</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) handleMemberFileUpload(p.id, e.target.files[0]);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeam(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Generating...' : 'Issue Certificates'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
