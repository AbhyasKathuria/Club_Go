import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { School } from '../../types';
import { Palette, CheckCircle2, AlertCircle, Save, Plus, Trash2, X } from 'lucide-react';

export const SchoolConfigTab: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingColors, setEditingColors] = useState<Record<string, string>>({});
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New School Modal / Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newColor, setNewColor] = useState('#10B981');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const data = await api.getSchools();
      setSchools(data);
      const colorMap: Record<string, string> = {};
      const nameMap: Record<string, string> = {};
      data.forEach((s) => {
        colorMap[s.id] = s.color_code;
        nameMap[s.id] = s.name;
      });
      setEditingColors(colorMap);
      setEditingNames(nameMap);
    } catch (err: any) {
      console.error('Failed to load schools:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = (id: string, hex: string) => {
    setEditingColors((prev) => ({ ...prev, [id]: hex }));
  };

  const handleNameChange = (id: string, name: string) => {
    setEditingNames((prev) => ({ ...prev, [id]: name }));
  };

  const handleSave = async (id: string) => {
    setSavingId(id);
    setMessage(null);
    setError(null);
    try {
      await api.updateSchool(id, {
        name: editingNames[id],
        color_code: editingColors[id],
      });
      setMessage('School styling saved successfully.');
      setTimeout(() => setMessage(null), 4000);
      await loadSchools();
    } catch (err: any) {
      setError(`Failed to update school: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (school: School) => {
    if (!window.confirm(`Are you sure you want to delete "${school.name}" (${school.code})? This cannot be undone.`)) {
      return;
    }

    setDeletingId(school.id);
    setMessage(null);
    setError(null);

    try {
      const res = await api.deleteSchool(school.id);
      setMessage(res.message || `School "${school.name}" was removed.`);
      setTimeout(() => setMessage(null), 4000);
      await loadSchools();
    } catch (err: any) {
      setError(err.message || 'Failed to delete school');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) {
      setError('School name and code are required.');
      return;
    }

    setIsCreating(true);
    setMessage(null);
    setError(null);

    try {
      await api.createSchool({
        name: newName.trim(),
        code: newCode.trim().toUpperCase(),
        color_code: newColor,
      });

      setMessage(`School "${newName}" (${newCode.toUpperCase()}) created successfully.`);
      setShowAddModal(false);
      setNewName('');
      setNewCode('');
      setNewColor('#10B981');
      await loadSchools();
    } catch (err: any) {
      setError(err.message || 'Failed to create school.');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading school settings...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-3">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Palette className="w-4 h-4" />
            <span>Dynamic Theme & School Settings</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">University School Configurations</h2>
          <p className="text-xs text-slate-500 mt-1">
            Add new faculties, customize brand colors, or remove unused schools. Changes immediately update registration and ticket passes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New School</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add School Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add University School / Faculty</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. School of Engineering"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    School Code
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. SOE"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 uppercase font-mono focus:outline-none focus:border-indigo-500"
                    maxLength={10}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-mono uppercase rounded-lg border border-slate-200"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div
                className="p-3 rounded-xl text-white text-xs font-bold flex items-center justify-between shadow-sm"
                style={{ backgroundColor: newColor }}
              >
                <span>{newName || 'Sample Faculty Name'}</span>
                <span className="opacity-90">{newCode.toUpperCase() || 'CODE'}</span>
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
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Existing Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schools.map((school) => {
          const currentColor = editingColors[school.id] || school.color_code;
          const currentName = editingNames[school.id] || school.name;

          return (
            <div
              key={school.id}
              className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: currentColor }}
                  />
                  <span className="font-black text-slate-900 text-sm tracking-wider">
                    {school.code}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => handleColorChange(school.id, e.target.value)}
                    className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <span className="font-mono text-xs text-slate-600 uppercase font-semibold">
                    {currentColor}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  School Name
                </label>
                <input
                  type="text"
                  value={currentName}
                  onChange={(e) => handleNameChange(school.id, e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-slate-800 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Live Preview Box */}
              <div
                className="p-2.5 rounded-lg text-white text-xs font-bold flex items-center justify-between shadow-sm"
                style={{ backgroundColor: currentColor }}
              >
                <span>Pass Theme Preview</span>
                <span className="opacity-90">{school.code}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleDelete(school)}
                  disabled={deletingId === school.id}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all"
                  title="Remove this school"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingId === school.id ? 'Deleting...' : 'Delete'}</span>
                </button>

                <button
                  onClick={() => handleSave(school.id)}
                  disabled={savingId === school.id}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Save className="w-3 h-3" />
                  <span>{savingId === school.id ? 'Saving...' : 'Save School'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
