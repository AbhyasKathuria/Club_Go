import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { School } from '../../types';
import { Palette, CheckCircle2, AlertCircle, Save, Plus } from 'lucide-react';

export const SchoolConfigTab: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingColors, setEditingColors] = useState<Record<string, string>>({});
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    try {
      await api.updateSchool(id, {
        name: editingNames[id],
        color_code: editingColors[id],
      });
      setMessage('School styling saved successfully.');
      setTimeout(() => setMessage(null), 4000);
      await loadSchools();
    } catch (err: any) {
      alert(`Failed to update school: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading school settings...</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
      
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
          <Palette className="w-4 h-4" />
          <span>Dynamic Theme Settings</span>
        </div>
        <h2 className="text-xl font-black text-slate-900">University School Configurations</h2>
        <p className="text-xs text-slate-500 mt-1">
          Customize school branding, color codes, and names. Changes immediately affect participant badges, QR passes, and registration screens.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

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

              <div className="text-right pt-1">
                <button
                  onClick={() => handleSave(school.id)}
                  disabled={savingId === school.id}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
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
