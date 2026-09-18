import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Event } from '../../types';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sliders,
  Eye,
  User,
  IdCard,
  Building2,
  Mail,
  GraduationCap,
  Phone,
  PhoneCall,
  BookOpen,
  Bookmark,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface FieldConfig {
  label: string;
  enabled: boolean;
  required: boolean;
  placeholder?: string;
  scope?: 'team' | 'participant';
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
  scope?: 'team' | 'participant';
}

export interface FormConfig {
  fields: {
    name: FieldConfig;
    roll_number: FieldConfig;
    school: FieldConfig;
    email: FieldConfig;
    university_email: FieldConfig;
    phone: FieldConfig;
    leader_phone: FieldConfig;
    semester: FieldConfig;
    section: FieldConfig;
  };
  custom_fields?: CustomField[];
}

export const DEFAULT_FORM_CONFIG: FormConfig = {
  fields: {
    name: { label: 'Full Name', enabled: true, required: true, scope: 'participant' },
    roll_number: { label: 'University Roll Number', enabled: true, required: true, scope: 'participant' },
    school: { label: 'School / Faculty', enabled: true, required: true, scope: 'team' },
    email: { label: 'Personal Email ID', enabled: true, required: true, scope: 'participant' },
    university_email: { label: 'University Email ID', enabled: false, required: false, scope: 'participant' },
    phone: { label: 'Contact Phone Number', enabled: true, required: true, scope: 'participant' },
    leader_phone: { label: 'Team Leader Contact Number', enabled: false, required: false, scope: 'team' },
    semester: { label: 'Semester / Year', enabled: false, required: false, scope: 'participant' },
    section: { label: 'Class & Section', enabled: false, required: false, scope: 'participant' },
  },
  custom_fields: [],
};

export const RegistrationFormBuilderTab: React.FC = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formConfig, setFormConfig] = useState<FormConfig>(DEFAULT_FORM_CONFIG);
  const [newCustomLabel, setNewCustomLabel] = useState('');
  const [newCustomType, setNewCustomType] = useState<'text' | 'number' | 'select'>('text');
  const [newCustomRequired, setNewCustomRequired] = useState(false);

  useEffect(() => {
    loadEventConfig();
  }, []);

  const loadEventConfig = async () => {
    try {
      const res = await api.getActiveEvent();
      if (res.event) {
        setEvent(res.event);
        if (res.event.form_config) {
          try {
            const parsed = JSON.parse(res.event.form_config);
            setFormConfig({
              fields: {
                ...DEFAULT_FORM_CONFIG.fields,
                ...(parsed.fields || {}),
              },
              custom_fields: parsed.custom_fields || [],
            });
          } catch (e) {
            setFormConfig(DEFAULT_FORM_CONFIG);
          }
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load event details' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleField = (key: keyof FormConfig['fields'], prop: 'enabled' | 'required') => {
    setFormConfig((prev) => {
      const current = prev.fields[key];
      const updated = {
        ...current,
        [prop]: !current[prop],
      };
      if (prop === 'enabled' && !updated.enabled) {
        updated.required = false;
      }
      if (prop === 'required' && updated.required) {
        updated.enabled = true;
      }

      return {
        ...prev,
        fields: {
          ...prev.fields,
          [key]: updated,
        },
      };
    });
  };

  const handleUpdateLabel = (key: keyof FormConfig['fields'], label: string) => {
    setFormConfig((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [key]: {
          ...prev.fields[key],
          label,
        },
      },
    }));
  };

  const handleAddCustomField = () => {
    if (!newCustomLabel.trim()) return;
    const id = 'custom_' + Date.now();
    const newField: CustomField = {
      id,
      label: newCustomLabel.trim(),
      type: newCustomType,
      required: newCustomRequired,
      scope: 'participant',
    };

    setFormConfig((prev) => ({
      ...prev,
      custom_fields: [...(prev.custom_fields || []), newField],
    }));

    setNewCustomLabel('');
    setNewCustomType('text');
    setNewCustomRequired(false);
  };

  const handleRemoveCustomField = (id: string) => {
    setFormConfig((prev) => ({
      ...prev,
      custom_fields: (prev.custom_fields || []).filter((f) => f.id !== id),
    }));
  };

  const handleSave = async () => {
    if (!event) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const configJson = JSON.stringify(formConfig);
      await api.updateEvent(event.id, {
        form_config: configJson,
      });

      setMessage({
        type: 'success',
        text: 'Registration form fields updated successfully! Changes are live on the public registration portal.',
      });
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save form configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading form builder...</div>;
  }

  const standardFieldKeys: Array<{
    key: keyof FormConfig['fields'];
    icon: any;
    desc: string;
  }> = [
    { key: 'name', icon: User, desc: 'Full student name of each participant' },
    { key: 'roll_number', icon: IdCard, desc: 'Official university roll number (e.g. 20231CSE0412)' },
    { key: 'school', icon: Building2, desc: 'Department/Faculty of the participating team' },
    { key: 'email', icon: Mail, desc: 'Personal primary email address' },
    { key: 'university_email', icon: GraduationCap, desc: 'Official student campus email (@university.edu)' },
    { key: 'phone', icon: Phone, desc: 'Contact phone / WhatsApp number for passes' },
    { key: 'leader_phone', icon: PhoneCall, desc: 'Direct emergency phone number for team leader' },
    { key: 'semester', icon: BookOpen, desc: 'Current academic semester or year (e.g. 5th Sem)' },
    { key: 'section', icon: Bookmark, desc: 'Class section / branch grouping (e.g. CSE-A)' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Form Configuration Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Registration Form Builder
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Choose what fields to display on the public registration portal. Enable or disable inputs, mark them mandatory, or add custom fields.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Form Schema'}</span>
        </button>
      </div>

      {message && (
        <div
          className={'p-4 rounded-xl border flex items-center space-x-2.5 text-xs font-semibold shadow-sm ' + (
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          )}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Standard Registration Fields
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Toggle on/off and configure mandatory status for standard student details
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {Object.values(formConfig.fields).filter((f) => f.enabled).length} Active
              </span>
            </div>

            <div className="space-y-3">
              {standardFieldKeys.map(({ key, icon: Icon, desc }) => {
                const cfg = formConfig.fields[key];
                return (
                  <div
                    key={key}
                    className={'p-4 rounded-xl border transition-all ' + (
                      cfg.enabled
                        ? 'bg-white border-slate-200 shadow-sm'
                        : 'bg-slate-50/60 border-slate-100 opacity-60'
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div
                          className={'p-2 rounded-xl mt-0.5 ' + (
                            cfg.enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800">{cfg.label}</span>
                            <span className="font-mono text-[10px] text-slate-400">({key})</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold uppercase">
                              {cfg.scope}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cfg.enabled}
                            onChange={() => handleToggleField(key, 'enabled')}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <span className={'text-xs font-semibold ' + (cfg.enabled ? 'text-slate-800' : 'text-slate-400')}>
                            Display
                          </span>
                        </label>

                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cfg.required}
                            disabled={!cfg.enabled}
                            onChange={() => handleToggleField(key, 'required')}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer disabled:opacity-40"
                          />
                          <span
                            className={'text-xs font-semibold ' + (
                              cfg.required ? 'text-rose-600 font-bold' : 'text-slate-400'
                            )}
                          >
                            Required
                          </span>
                        </label>
                      </div>
                    </div>

                    {cfg.enabled && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center space-x-2">
                        <label className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                          Custom Label:
                        </label>
                        <input
                          type="text"
                          value={cfg.label}
                          onChange={(e) => handleUpdateLabel(key, e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Custom Registration Fields
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Add specialized questions (e.g. GitHub URL, Dietary Preference, T-Shirt Size)
              </p>
            </div>

            {formConfig.custom_fields && formConfig.custom_fields.length > 0 ? (
              <div className="space-y-2.5">
                {formConfig.custom_fields.map((cf) => (
                  <div
                    key={cf.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{cf.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold uppercase">
                          {cf.type}
                        </span>
                        {cf.required && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold uppercase">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cf.id}</div>
                    </div>

                    <button
                      onClick={() => handleRemoveCustomField(cf.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No custom questions added. You can add one below.
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Add New Custom Field</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  placeholder="Field label (e.g. GitHub URL)"
                  value={newCustomLabel}
                  onChange={(e) => setNewCustomLabel(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                />

                <select
                  value={newCustomType}
                  onChange={(e: any) => setNewCustomType(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="text">Text Input</option>
                  <option value="number">Number</option>
                  <option value="select">Selection Dropdown</option>
                </select>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newCustomRequired}
                      onChange={(e) => setNewCustomRequired(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span>Required</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    disabled={!newCustomLabel.trim()}
                    className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
                  >
                    + Add Field
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-20 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Live Student Registration Form Preview</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full uppercase tracking-wider">
                Live Preview
              </span>
            </div>

            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Team Level Information
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Team Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    placeholder="e.g. CyberKnights"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-400"
                  />
                </div>

                {formConfig.fields.school.enabled && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {formConfig.fields.school.label} {formConfig.fields.school.required && <span className="text-rose-500">*</span>}
                    </label>
                    <select
                      disabled
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-400"
                    >
                      <option>SOCSE • School of Computer Science & Engineering</option>
                    </select>
                  </div>
                )}

                {formConfig.fields.leader_phone.enabled && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {formConfig.fields.leader_phone.label} {formConfig.fields.leader_phone.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      disabled
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-400"
                    />
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Member 1 (Team Leader)
                </span>

                {formConfig.fields.name.enabled && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {formConfig.fields.name.label} {formConfig.fields.name.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      disabled
                      placeholder="Full Name"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-400"
                    />
                  </div>
                )}

                {formConfig.fields.roll_number.enabled && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {formConfig.fields.roll_number.label} {formConfig.fields.roll_number.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      disabled
                      placeholder="e.g. 20231CSE0412"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-400 font-mono uppercase"
                    />
                  </div>
                )}

                {formConfig.fields.email.enabled && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {formConfig.fields.email.label} {formConfig.fields.email.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="email"
                      disabled
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-400"
                    />
                  </div>
                )}

                {formConfig.fields.university_email.enabled && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {formConfig.fields.university_email.label} {formConfig.fields.university_email.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="email"
                      disabled
                      placeholder="student@university.edu"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-400"
                    />
                  </div>
                )}

                {formConfig.fields.phone.enabled && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {formConfig.fields.phone.label} {formConfig.fields.phone.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="tel"
                      disabled
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-400"
                    />
                  </div>
                )}

                {formConfig.fields.semester.enabled && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {formConfig.fields.semester.label} {formConfig.fields.semester.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      disabled
                      placeholder="e.g. 5th Semester"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-400"
                    />
                  </div>
                )}

                {formConfig.fields.section.enabled && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {formConfig.fields.section.label} {formConfig.fields.section.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      disabled
                      placeholder="e.g. CSE-A"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-400"
                    />
                  </div>
                )}

                {formConfig.custom_fields && formConfig.custom_fields.map((cf) => (
                  <div key={cf.id}>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {cf.label} {cf.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type={cf.type === 'number' ? 'number' : 'text'}
                      disabled
                      placeholder={'Enter ' + cf.label}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-400"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Preview updates automatically</span>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Save Now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
