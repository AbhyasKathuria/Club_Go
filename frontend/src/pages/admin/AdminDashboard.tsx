import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../api/client';
import { LiveDashboardData, Team, SchoolStat } from '../../types';
import { EventConfigTab } from './EventConfigTab';
import { SchoolConfigTab } from './SchoolConfigTab';
import { CoordinatorConfigTab } from './CoordinatorConfigTab';
import { ResultsConfigTab } from './ResultsConfigTab';
import { RegistrationFormBuilderTab } from './RegistrationFormBuilderTab';
import {
  Users,
  UserCheck,
  Building2,
  Download,
  Database,
  Search,
  Filter,
  Trash2,
  AlertTriangle,
  Radio,
  Sliders,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Clock,
  ExternalLink,
  Award,
  Trophy,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { socket, isConnected } = useSocket();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'coordinators' | 'results' | 'school-config' | 'event-config' | 'form-builder'
  >('dashboard');
  const [data, setData] = useState<LiveDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'CHECKED_IN' | 'NOT_ATTENDED'>('ALL');

  // Soft-Delete Confirmation Modal State
  const [deleteTargetTeam, setDeleteTargetTeam] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  // Load initial data
  const loadDashboardData = async () => {
    try {
      const res = await api.getLiveDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Real-time WebSocket Listeners
  useEffect(() => {
    if (!socket) return;

    socket.emit('subscribe:dashboard');

    const handleAttendanceUpdate = (payload: any) => {
      console.log('⚡ Real-time update received:', payload);
      // Refresh dashboard data smoothly
      loadDashboardData();
      setFlashMessage(`Live Scan: ${payload.participantName || payload.teamName} marked Present`);
      setTimeout(() => setFlashMessage(null), 5000);
    };

    const handleStatsUpdate = (stats: any) => {
      loadDashboardData();
    };

    socket.on('attendance:updated', handleAttendanceUpdate);
    socket.on('stats:updated', handleStatsUpdate);

    return () => {
      socket.off('attendance:updated', handleAttendanceUpdate);
      socket.off('stats:updated', handleStatsUpdate);
    };
  }, [socket]);

  // Handle Soft-Delete
  const handleConfirmSoftDelete = async () => {
    if (!deleteTargetTeam) return;
    setIsDeleting(true);

    try {
      await api.softDeleteTeam(deleteTargetTeam.id);
      setFlashMessage(`Team "${deleteTargetTeam.teamName}" was soft-deleted.`);
      setDeleteTargetTeam(null);
      await loadDashboardData();
      setTimeout(() => setFlashMessage(null), 4000);
    } catch (err: any) {
      alert(`Soft-delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered teams list
  const filteredTeams = (data?.teams || []).filter((team) => {
    // School filter
    if (selectedSchoolFilter !== 'ALL' && team.school.code !== selectedSchoolFilter) {
      return false;
    }

    // Attendance status filter
    if (selectedStatusFilter === 'CHECKED_IN') {
      const hasCheckedInMember = team.participants.some((p) => p.attendanceStatus === 'CHECKED_IN');
      if (!team.checkedIn && !hasCheckedInMember) return false;
    } else if (selectedStatusFilter === 'NOT_ATTENDED') {
      const allUnchecked = team.participants.every((p) => p.attendanceStatus === 'NOT_ATTENDED');
      if (team.checkedIn || !allUnchecked) return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTeam = team.teamName.toLowerCase().includes(q) || team.qrToken.toLowerCase().includes(q);
      const matchParticipant = team.participants.some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.qrToken.toLowerCase().includes(q)
      );
      if (!matchTeam && !matchParticipant) return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              {user?.role} Portal
            </span>
            <span className="text-slate-300">•</span>
            <div className="flex items-center space-x-1.5 text-xs font-semibold">
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
              <span className={isConnected ? 'text-emerald-700' : 'text-amber-700'}>
                {isConnected ? 'Real-time WebSocket Live' : 'Connecting WebSocket...'}
              </span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Coordinator Command Center
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Dashboard
          </button>

          <button
            onClick={() => setActiveTab('coordinators')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'coordinators'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Co-ordinators</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'results'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Results & Certs</span>
          </button>

          <button
            onClick={() => setActiveTab('school-config')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'school-config'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            School Colors
          </button>

          <button
            onClick={() => setActiveTab('event-config')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'event-config'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Event Config
          </button>

          <button
            onClick={() => setActiveTab('form-builder')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === 'form-builder'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Form Builder</span>
          </button>
        </div>
      </div>

      {/* Live notification flash */}
      {flashMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{flashMessage}</span>
        </div>
      )}

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'coordinators' && <CoordinatorConfigTab />}
      {activeTab === 'results' && <ResultsConfigTab />}
      {activeTab === 'school-config' && <SchoolConfigTab />}
      {activeTab === 'event-config' && <EventConfigTab />}
      {activeTab === 'form-builder' && <RegistrationFormBuilderTab />}

      {activeTab === 'dashboard' && data && (
        <div className="space-y-6">
          
          {/* KPI Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Registered Teams
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {data.overview.totalTeams}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {data.overview.checkedInTeams} checked in
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Participants
                </span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2">
                {data.overview.totalParticipants}
              </div>
              <p className="text-xs text-slate-400 mt-1">Across all schools</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Checked In
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-600 mt-2">
                {data.overview.checkedInParticipants}
              </div>
              <p className="text-xs text-slate-400 mt-1">Present on campus</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Turnout Rate
                </span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-purple-600 mt-2">
                {data.overview.attendancePercentage}%
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${data.overview.attendancePercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* School Turnout Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
              Turnout by School
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.schoolStats.map((school) => (
                <div
                  key={school.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md text-white shadow-sm"
                      style={{ backgroundColor: school.colorCode }}
                    >
                      {school.code}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {school.attendancePercentage}%
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 truncate">{school.name}</div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 pt-1">
                    <span>
                      {school.checkedInParticipants} / {school.totalParticipants} present
                    </span>
                    <span className="text-slate-400">{school.totalTeams} teams</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: school.colorCode,
                        width: `${school.attendancePercentage}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table Header & Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by team, student, or token..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                {/* School Filter */}
                <select
                  value={selectedSchoolFilter}
                  onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Schools</option>
                  {data.schoolStats.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} ({s.name})
                    </option>
                  ))}
                </select>

                {/* Attendance Filter */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Attendance</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="NOT_ATTENDED">Pending</option>
                </select>
              </div>

              {/* Export & Backup Buttons */}
              <div className="flex items-center space-x-2">
                <a
                  href={api.getExcelDownloadUrl()}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export to Excel (.xlsx)</span>
                </a>

                {isSuperAdmin && (
                  <a
                    href={api.getSnapshotDownloadUrl()}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                    title="Download complete JSON snapshot backup"
                  >
                    <Database className="w-4 h-4" />
                    <span>Backup Snapshot</span>
                  </a>
                )}
              </div>

            </div>

            {/* Live Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-bold">Team Name</th>
                    <th className="px-5 py-3 font-bold">School</th>
                    <th className="px-5 py-3 font-bold">Members & Attendance</th>
                    <th className="px-5 py-3 font-bold">Team Status</th>
                    <th className="px-5 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                        No registration records matching current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((team) => (
                      <tr key={team.id} className="hover:bg-slate-50/70 transition-colors">
                        
                        {/* Team Name & Token */}
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {team.teamName}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                            {team.qrToken}
                          </div>
                        </td>

                        {/* School Badge */}
                        <td className="px-5 py-4">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black text-white"
                            style={{ backgroundColor: team.school.color_code || team.school.colorCode }}
                          >
                            {team.school.code}
                          </span>
                        </td>

                        {/* Participants List */}
                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            {team.participants.map((p) => {
                              const isChecked = p.attendanceStatus === 'CHECKED_IN';
                              return (
                                <div key={p.id} className="flex items-center space-x-2">
                                  <span
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                      isChecked ? 'bg-emerald-500' : 'bg-slate-300'
                                    }`}
                                  />
                                  <span className="text-slate-800 font-medium">{p.name}</span>
                                  <span className="text-slate-400 text-[10px]">({p.email})</span>
                                  {isChecked && p.checkedInAt && (
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                                      {new Date(p.checkedInAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Team Status */}
                        <td className="px-5 py-4">
                          {team.checkedIn ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Checked In</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Actions (Strict Zero Data Loss: Soft-delete only for superadmin with confirmation) */}
                        <td className="px-5 py-4 text-right">
                          {isSuperAdmin ? (
                            <button
                              onClick={() => setDeleteTargetTeam(team)}
                              className="inline-flex items-center space-x-1 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Soft-delete team (Superadmin only)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">View Only</span>
                          )}
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500 flex items-center justify-between">
              <span>Showing {filteredTeams.length} of {data.teams.length} total teams</span>
              <span className="font-semibold text-emerald-700">● Live Synchronization Active</span>
            </div>

          </div>

        </div>
      )}

      {/* Zero Data-Loss Soft-Delete Confirmation Modal */}
      {deleteTargetTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="p-2 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Confirm Soft-Delete Team
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to soft-delete team <strong>"{deleteTargetTeam.teamName}"</strong> ({deleteTargetTeam.participants.length} participants)?
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
              <div className="font-bold">Zero Data-Loss Compliance:</div>
              <div>
                This action flags records as deleted (<code className="font-mono">is_deleted = true</code>). Physical records and scan audit logs remain permanently preserved in the database and backup archives.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteTargetTeam(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmSoftDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Soft-Deleting...' : 'Confirm Soft-Delete'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
