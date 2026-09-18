import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { CoordinatorUser } from '../../types';
import {
  UserCheck,
  Shield,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Trash2,
  Clock,
  Mail,
  User,
  X,
} from 'lucide-react';

export const CoordinatorConfigTab: React.FC = () => {
  const [coordinators, setCoordinators] = useState<CoordinatorUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Add Coordinator Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSchool, setNewSchool] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const loadCoordinators = async () => {
    try {
      const data = await api.getCoordinators();
      setCoordinators(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load coordinators');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoordinators();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    setProcessingId(id);
    setMessage(null);
    setError(null);
    try {
      const res = await api.approveCoordinator(id);
      setMessage(res.message || `Access approved for ${name}.`);
      setTimeout(() => setMessage(null), 4000);
      await loadCoordinators();
    } catch (err: any) {
      setError(err.message || 'Failed to approve access');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    if (!window.confirm(`Revoke scanner access for Student Co-ordinator "${name}"? They will not be able to log in.`)) {
      return;
    }
    setProcessingId(id);
    setMessage(null);
    setError(null);
    try {
      const res = await api.revokeCoordinator(id);
      setMessage(res.message || `Access revoked for ${name}.`);
      setTimeout(() => setMessage(null), 4000);
      await loadCoordinators();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke access');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently remove Student Co-ordinator "${name}"? This cannot be undone.`)) {
      return;
    }
    setProcessingId(id);
    setMessage(null);
    setError(null);
    try {
      const res = await api.deleteCoordinator(id);
      setMessage(res.message || `Coordinator removed.`);
      setTimeout(() => setMessage(null), 4000);
      await loadCoordinators();
    } catch (err: any) {
      setError(err.message || 'Failed to delete coordinator');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage(null);
    setError(null);
    try {
      await api.createCoordinator({
        name: newName.trim(),
        username: newUsername.trim(),
        password: newPassword.trim(),
        roll_number: newPassword.trim(),
        email: newEmail.trim(),
        phone: newPhone.trim() || undefined,
        school_name: newSchool.trim() || undefined,
      });
      setMessage(`Student Co-ordinator "${newName}" added and pre-approved.`);
      setShowAddModal(false);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewEmail('');
      setNewPhone('');
      setNewSchool('');
      await loadCoordinators();
    } catch (err: any) {
      setError(err.message || 'Failed to create coordinator');
    } finally {
      setIsCreating(false);
    }
  };

  const pendingCount = coordinators.filter((c) => !c.is_approved).length;

  const filteredCoordinators = coordinators.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PENDING'
        ? !c.is_approved
        : c.is_approved;

    return matchSearch && matchStatus;
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading student co-ordinators...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Access Control & Approvals</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Student Co-ordinators</h2>
          <p className="text-xs text-slate-500 mt-1">
            Review registration requests, approve or revoke scanner entrance permissions, and monitor staff roster.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Co-ordinator</span>
        </button>
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

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, username, roll number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({coordinators.length})
          </button>

          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1.5 ${
              statusFilter === 'PENDING'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-500 text-white font-black">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Approved ({coordinators.filter((c) => c.is_approved).length})
          </button>
        </div>
      </div>

      {/* Coordinators Table */}
      <div className="border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Student Co-ordinator</th>
                <th className="px-4 py-3">Username & Roll No</th>
                <th className="px-4 py-3">University Email</th>
                <th className="px-4 py-3">Access Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoordinators.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                    No student co-ordinators found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCoordinators.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {c.school_name || 'Presidency University'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono text-slate-700 font-bold">@{c.username}</div>
                      <div className="font-mono text-[11px] text-blue-600 font-semibold mt-0.5">
                        Roll: {c.roll_number}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-slate-600">{c.email}</div>
                      {c.phone && <div className="text-[11px] text-slate-400">{c.phone}</div>}
                    </td>

                    <td className="px-4 py-3.5">
                      {c.is_approved ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Approved & Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Pending Approval</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {!c.is_approved ? (
                        <button
                          onClick={() => handleApprove(c.id, c.name)}
                          disabled={processingId === c.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                        >
                          {processingId === c.id ? 'Approving...' : 'Approve Access'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRevoke(c.id, c.name)}
                          disabled={processingId === c.id}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                          title="Revoke active access"
                        >
                          {processingId === c.id ? 'Revoking...' : 'Revoke'}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={processingId === c.id}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete coordinator"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coordinator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Authorized Student Co-ordinator</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. rahul_s"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter login password"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">University Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rahul.s@university.edu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">School</label>
                  <input
                    type="text"
                    value={newSchool}
                    onChange={(e) => setNewSchool(e.target.value)}
                    placeholder="e.g. SOCSE"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isCreating ? 'Adding...' : 'Add Co-ordinator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
