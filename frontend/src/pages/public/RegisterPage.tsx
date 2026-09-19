import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../../api/client';
import { School, Event } from '../../types';
import { getSchoolTheme, DEFAULT_SCHOOL_COLORS } from '../../utils/themeHelper';
import { QRPassCard } from '../../components/QRPassCard';
import { FormConfig, DEFAULT_FORM_CONFIG } from '../admin/RegistrationFormBuilderTab';
import {
  Users,
  Sparkles,
  Building2,
  AlertCircle,
  ArrowRight,
  Shield,
  Mail,
  Phone,
  UserCheck,
  UserPlus,
  Trash2,
  IdCard,
  GraduationCap,
  BookOpen,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';

interface ParticipantData {
  name: string;
  rollNumber: string;
  email: string;
  universityEmail: string;
  phone: string;
  semester: string;
  section: string;
  customFields: Record<string, string>;
}

export const RegisterPage: React.FC = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // Form State
  const [teamName, setTeamName] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [teamSize, setTeamSize] = useState<number>(1);
  const [participants, setParticipants] = useState<ParticipantData[]>([
    {
      name: '',
      rollNumber: '',
      email: '',
      universityEmail: '',
      phone: '',
      semester: '',
      section: '',
      customFields: {},
    },
  ]);

  // Success State
  const [registeredData, setRegisteredData] = useState<any | null>(null);

  useEffect(() => {
    async function loadActiveEvent() {
      try {
        const res = await api.getActiveEvent();
        setEvent(res.event);
        setSchools(res.schools || []);
        if (res.schools && res.schools.length > 0) {
          setSelectedSchoolId(res.schools[0].id);
        }
        if (res.event) {
          const initialSize = res.event.min_team_size || 1;
          setTeamSize(initialSize);
          updateParticipantsCount(initialSize);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load active event');
      } finally {
        setIsLoading(false);
      }
    }
    loadActiveEvent();
  }, []);

  // Parse Form Configuration
  const formConfig: FormConfig = useMemo(() => {
    if (event?.form_config) {
      try {
        const parsed = JSON.parse(event.form_config);
        return {
          fields: {
            ...DEFAULT_FORM_CONFIG.fields,
            ...(parsed.fields || {}),
          },
          custom_fields: parsed.custom_fields || [],
        };
      } catch (e) {
        return DEFAULT_FORM_CONFIG;
      }
    }
    return DEFAULT_FORM_CONFIG;
  }, [event?.form_config]);

  const updateParticipantsCount = (count: number) => {
    setTeamSize(count);
    setError(null);
    setParticipants((prev) => {
      const next = [...prev];
      while (next.length < count) {
        next.push({
          name: '',
          rollNumber: '',
          email: '',
          universityEmail: '',
          phone: '',
          semester: '',
          section: '',
          customFields: {},
        });
      }
      return next.slice(0, count);
    });
  };

  const addParticipant = () => {
    if (!event) return;
    if (participants.length >= event.max_team_size) {
      setError(`Maximum team size for this event is ${event.max_team_size} members.`);
      return;
    }
    setError(null);
    const next = [
      ...participants,
      {
        name: '',
        rollNumber: '',
        email: '',
        universityEmail: '',
        phone: '',
        semester: '',
        section: '',
        customFields: {},
      },
    ];
    setParticipants(next);
    setTeamSize(next.length);
  };

  const removeParticipant = (index: number) => {
    if (!event) return;
    if (participants.length <= event.min_team_size) {
      setError(
        `Minimum team size for this event is ${event.min_team_size} member${
          event.min_team_size > 1 ? 's' : ''
        }.`
      );
      return;
    }
    setError(null);
    const next = participants.filter((_, i) => i !== index);
    setParticipants(next);
    setTeamSize(next.length);
  };

  const handleParticipantChange = (
    index: number,
    field: keyof Omit<ParticipantData, 'customFields'>,
    value: string
  ) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleCustomFieldChange = (index: number, fieldId: string, value: string) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        customFields: {
          ...next[index].customFields,
          [fieldId]: value,
        },
      };
      return next;
    });
  };

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);
  const schoolTheme = getSchoolTheme(selectedSchool?.code, selectedSchool?.color_code);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSubmitting || isSubmittingRef.current) return;

    if (!teamName.trim()) {
      showError('Please provide a team name.');
      return;
    }

    if (formConfig.fields.school.enabled && !selectedSchoolId) {
      showError('Please select a school.');
      return;
    }

    if (formConfig.fields.leader_phone.enabled && formConfig.fields.leader_phone.required && !leaderPhone.trim()) {
      showError('Please provide the team leader contact phone number.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const memberLabel = i === 0 ? 'Team Leader' : `Member ${i + 1}`;

      // Full name
      if (formConfig.fields.name.enabled && formConfig.fields.name.required && !p.name.trim()) {
        showError(`Please enter the full name for ${memberLabel}.`);
        return;
      }

      // Roll Number
      if (formConfig.fields.roll_number.enabled && formConfig.fields.roll_number.required && !p.rollNumber.trim()) {
        showError(`Please enter the university roll number for ${memberLabel}.`);
        return;
      }

      // Personal Email
      if (formConfig.fields.email.enabled) {
        if (formConfig.fields.email.required && !p.email.trim()) {
          showError(`Please enter the email address for ${memberLabel}.`);
          return;
        }
        if (p.email.trim() && !emailRegex.test(p.email.trim())) {
          showError(`"${p.email.trim()}" is not a valid email address for ${memberLabel}.`);
          return;
        }
      }

      // University Email
      if (formConfig.fields.university_email.enabled) {
        if (formConfig.fields.university_email.required && !p.universityEmail.trim()) {
          showError(`Please enter the university campus email for ${memberLabel}.`);
          return;
        }
        if (p.universityEmail.trim() && !emailRegex.test(p.universityEmail.trim())) {
          showError(`"${p.universityEmail.trim()}" is not a valid email address for ${memberLabel}.`);
          return;
        }
      }

      // Contact phone
      if (formConfig.fields.phone.enabled && formConfig.fields.phone.required && !p.phone.trim()) {
        showError(`Please enter the contact phone number for ${memberLabel}.`);
        return;
      }

      // Semester
      if (formConfig.fields.semester.enabled && formConfig.fields.semester.required && !p.semester.trim()) {
        showError(`Please specify the semester/year for ${memberLabel}.`);
        return;
      }

      // Section
      if (formConfig.fields.section.enabled && formConfig.fields.section.required && !p.section.trim()) {
        showError(`Please specify the section for ${memberLabel}.`);
        return;
      }

      // Custom fields required check
      if (formConfig.custom_fields) {
        for (const cf of formConfig.custom_fields) {
          if (cf.required && !p.customFields[cf.id]?.trim()) {
            showError(`Please fill out "${cf.label}" for ${memberLabel}.`);
            return;
          }
        }
      }
    }

    // Check for duplicate emails within this submission
    const cleanedEmails = participants
      .map((p) => (p.email || p.universityEmail || '').trim().toLowerCase())
      .filter((e) => e.length > 0);
    const dupEmail = cleanedEmails.find((item, index) => cleanedEmails.indexOf(item) !== index);
    if (dupEmail) {
      showError(`Each team member must have a unique email address. Duplicate detected: "${dupEmail}".`);
      return;
    }

    // Check for duplicate roll numbers within this submission
    const cleanedRolls = participants
      .map((p) => p.rollNumber.trim().toUpperCase())
      .filter((r) => r.length > 0);
    const dupRoll = cleanedRolls.find((item, index) => cleanedRolls.indexOf(item) !== index);
    if (dupRoll) {
      showError(`Each team member must have a unique roll number. Duplicate detected: "${dupRoll}".`);
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const payload = {
        eventId: event?.id,
        schoolId: selectedSchoolId,
        teamName: teamName.trim(),
        leaderPhone: leaderPhone.trim() || undefined,
        participants: participants.map((p) => ({
          name: p.name.trim(),
          rollNumber: p.rollNumber.trim(),
          roll_number: p.rollNumber.trim(),
          email: (p.email || p.universityEmail).trim().toLowerCase(),
          universityEmail: p.universityEmail.trim().toLowerCase(),
          phone: p.phone.trim(),
          semester: p.semester.trim() || undefined,
          section: p.section.trim() || undefined,
          customFields: p.customFields,
        })),
      };

      const result = await api.registerTeam(payload);
      setRegisteredData(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: [schoolTheme.hex, '#2563EB', '#10B981', '#F59E0B'],
      });
    } catch (err: any) {
      showError(err.message || 'Registration failed. Please verify details and try again.');
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // If no launched event is active
  if (!event || event.status !== 'LAUNCHED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Registration Portal Currently Closed
        </h2>
        <p className="text-slate-600 mt-2 max-w-md mx-auto text-sm">
          The event coordinator has not yet launched the public registration window. Please check back shortly or reach out to the university club committee.
        </p>
        <div className="mt-8 p-4 bg-white border border-slate-200 rounded-xl inline-block text-xs font-medium text-slate-500 shadow-sm">
          Status: <span className="font-bold text-amber-600">{event ? event.status : 'NO ACTIVE EVENT'}</span>
        </div>
      </div>
    );
  }

  // If registration was successful, show Confirmation / Pass view
  if (registeredData) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-10 sm:pt-14 pb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Registration Confirmed</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            You're In, {registeredData.team.teamName}!
          </h1>
          <p className="text-slate-600 text-sm max-w-md mx-auto mt-2">
            Your registration passes have been generated and dispatched to{' '}
            <strong className="text-slate-800">
              {registeredData.participants[0]?.email || 'your primary email'}
            </strong>.
          </p>
        </div>

        <QRPassCard
          team={{
            id: registeredData.team.id,
            teamName: registeredData.team.teamName,
            teamSize: registeredData.team.teamSize,
            qrToken: registeredData.team.qrToken,
            school: registeredData.team.school,
            event: {
              name: event.name,
              sponsor_name: event.sponsor_name,
              sponsor_logo_url: event.sponsor_logo_url,
            },
          }}
          teamQrDataUrl={registeredData.teamQrDataUrl}
          participants={registeredData.participants}
        />

        <div className="text-center mt-8">
          <button
            onClick={() => {
              setRegisteredData(null);
              setTeamName('');
              setLeaderPhone('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← Register Another Team
          </button>
        </div>
      </div>
    );
  }

  // Active registration form
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      
      {/* Institutional Organizer Branding Banner: 2 on top, 2 below on mobile; 1 row on desktop */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm mb-6">
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-around gap-4 sm:gap-6 border-b border-slate-100 pb-4">
          {/* Top-Left / Desktop 1: Presidency University */}
          <div className="flex items-center justify-center">
            <img
              src="/images/Presidency.png"
              alt="Presidency University"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </div>

          <div className="hidden sm:block h-7 w-px bg-slate-200 flex-shrink-0" />

          {/* Top-Right / Desktop 2: DSA NAAC A Accredited */}
          <div className="flex items-center justify-center">
            <img
              src="/images/DSA NAAC.png"
              alt="DSA NAAC A Accredited"
              className="h-7 sm:h-9 w-auto object-contain"
            />
          </div>

          <div className="hidden sm:block h-7 w-px bg-slate-200 flex-shrink-0" />

          {/* Bottom-Left / Desktop 3: Institution's Innovation Council */}
          <div className="flex items-center justify-center">
            <img
              src="/images/iiclogo.png"
              alt="Institution's Innovation Council"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </div>

          <div className="hidden sm:block h-7 w-px bg-slate-200 flex-shrink-0" />

          {/* Bottom-Right / Desktop 4: CogniCore Club */}
          <div className="flex items-center justify-center space-x-2">
            <img
              src="/images/CogniCore Logo.png"
              alt="CogniCore Club"
              className="h-10 sm:h-11 w-auto object-contain drop-shadow-sm"
            />
            <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight whitespace-nowrap">
              CogniCore Club
            </span>
          </div>
        </div>

        {/* Institutional subtitle */}
        <div className="pt-3 text-center text-xs text-slate-600 font-semibold leading-relaxed">
          Presidency University • Department of Student Affairs (DSA) • Presidency School of Information Science
        </div>
      </div>

      {/* Event Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm mb-8 text-center relative overflow-hidden">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Official Event Registration</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {event.name}
        </h1>

        {event.description && (
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto mt-2">
            {event.description}
          </p>
        )}

        {/* Sponsor Showcase */}
        {event.sponsor_name && (
          <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-center space-x-3 text-xs text-slate-500">
            <span>Powered by</span>
            {event.sponsor_logo_url ? (
              <img
                src={event.sponsor_logo_url}
                alt={event.sponsor_name}
                className="h-6 object-contain"
              />
            ) : null}
            <span className="font-bold text-slate-800">{event.sponsor_name}</span>
          </div>
        )}
      </div>

      {error && (
        <div
          ref={errorRef}
          className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-sm flex items-start space-x-3 shadow-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-1">
            <div className="font-bold text-rose-900 text-sm">Registration Notice</div>
            <div className="text-xs sm:text-sm font-medium">{error}</div>
            {error.toLowerCase().includes('already registered') && (
              <p className="text-xs text-rose-700/90 pt-1 leading-relaxed">
                💡 <strong>Tip:</strong> If your team is already registered, admission passes were dispatched to your email. You can also view event outcomes on the <strong>Results & Certs</strong> tab or consult the student coordinator desk at the entrance.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: School Selection */}
        {formConfig.fields.school.enabled && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center space-x-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: schoolTheme.hex }}
              >
                1
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {formConfig.fields.school.label}
                </h2>
                <p className="text-xs text-slate-500">
                  Determines your team's visual theme and pass branding
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {schools.map((s) => {
                const isSelected = selectedSchoolId === s.id;

                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSelectedSchoolId(s.id)}
                    className={`flex items-center space-x-3 p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-2 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                    style={{
                      borderColor: isSelected ? s.color_code : undefined,
                      backgroundColor: isSelected ? `${s.color_code}10` : undefined,
                    }}
                  >
                    <div
                      className="w-4 h-10 rounded-md flex-shrink-0"
                      style={{ backgroundColor: s.color_code }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black tracking-wider uppercase" style={{ color: s.color_code }}>
                        {s.code}
                      </div>
                      <div className="text-sm font-semibold text-slate-800 truncate">
                        {s.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Team Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center space-x-2.5 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: schoolTheme.hex }}
            >
              {formConfig.fields.school.enabled ? '2' : '1'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Team Details</h2>
              <p className="text-xs text-slate-500">
                Choose a creative team name and select the number of members
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Team Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. AlgoWarriors, Quantum Pioneers"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                required
              />
            </div>

            {/* Optional Team Leader Phone if enabled */}
            {formConfig.fields.leader_phone.enabled && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {formConfig.fields.leader_phone.label}{' '}
                  {formConfig.fields.leader_phone.required && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={leaderPhone}
                    onChange={(e) => setLeaderPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-sm font-medium"
                    required={formConfig.fields.leader_phone.required}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Team Size / Format
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Array.from(
                  { length: event.max_team_size - event.min_team_size + 1 },
                  (_, i) => event.min_team_size + i
                ).map((size) => {
                  const isSelected = teamSize === size;
                  const label =
                    size === 1
                      ? 'Solo (1)'
                      : size === 2
                      ? 'Pair (2)'
                      : size === 3
                      ? 'Trio (3)'
                      : `Squad (${size})`;
                  const sublabel =
                    size === 1
                      ? '1 Member'
                      : `${size} Members`;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => updateParticipantsCount(size)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-transparent text-white shadow-md'
                          : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100/80'
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: schoolTheme.hex }
                          : undefined
                      }
                    >
                      <div className="font-black text-sm tracking-tight">{label}</div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                        {sublabel}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Member Roster (Dynamically rendered fields) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: schoolTheme.hex }}
              >
                {formConfig.fields.school.enabled ? '3' : '2'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Member Information</h2>
                <p className="text-xs text-slate-500">
                  {event.allowed_email_domain
                    ? `Must use university email (@${event.allowed_email_domain})`
                    : 'Individual QR passes will be generated for each person'}
                </p>
              </div>
            </div>

            {participants.length < event.max_team_size && (
              <button
                type="button"
                onClick={addParticipant}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {participants.map((p, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      {idx === 0 ? 'Team Leader / Primary Contact' : `Member #${idx + 1}`}
                    </span>
                    {idx === 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Primary Pass
                      </span>
                    )}
                  </div>

                  {idx > 0 && participants.length > event.min_team_size && (
                    <button
                      type="button"
                      onClick={() => removeParticipant(idx)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                      title="Remove this member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  
                  {/* Full Name */}
                  {formConfig.fields.name.enabled && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {formConfig.fields.name.label}{' '}
                        {formConfig.fields.name.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleParticipantChange(idx, 'name', e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        required={formConfig.fields.name.required}
                      />
                    </div>
                  )}

                  {/* University Roll Number */}
                  {formConfig.fields.roll_number.enabled && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {formConfig.fields.roll_number.label}{' '}
                        {formConfig.fields.roll_number.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={p.rollNumber}
                        onChange={(e) => handleParticipantChange(idx, 'rollNumber', e.target.value)}
                        placeholder="e.g. 20231CSE0412"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono uppercase focus:outline-none focus:border-blue-500 bg-white"
                        required={formConfig.fields.roll_number.required}
                      />
                    </div>
                  )}

                  {/* Personal Email */}
                  {formConfig.fields.email.enabled && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {formConfig.fields.email.label}{' '}
                        {formConfig.fields.email.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="email"
                        value={p.email}
                        onChange={(e) => handleParticipantChange(idx, 'email', e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        required={formConfig.fields.email.required}
                      />
                    </div>
                  )}

                  {/* University Email */}
                  {formConfig.fields.university_email.enabled && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {formConfig.fields.university_email.label}{' '}
                        {formConfig.fields.university_email.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="email"
                        value={p.universityEmail}
                        onChange={(e) => handleParticipantChange(idx, 'universityEmail', e.target.value)}
                        placeholder={
                          event.allowed_email_domain
                            ? `id@${event.allowed_email_domain}`
                            : 'alex@university.edu'
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        required={formConfig.fields.university_email.required}
                      />
                    </div>
                  )}

                  {/* Contact Phone */}
                  {formConfig.fields.phone.enabled && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {formConfig.fields.phone.label}{' '}
                        {formConfig.fields.phone.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="tel"
                        value={p.phone}
                        onChange={(e) => handleParticipantChange(idx, 'phone', e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        required={formConfig.fields.phone.required}
                      />
                    </div>
                  )}

                  {/* Semester */}
                  {formConfig.fields.semester.enabled && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {formConfig.fields.semester.label}{' '}
                        {formConfig.fields.semester.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={p.semester}
                        onChange={(e) => handleParticipantChange(idx, 'semester', e.target.value)}
                        placeholder="e.g. 5th Semester"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        required={formConfig.fields.semester.required}
                      />
                    </div>
                  )}

                  {/* Section */}
                  {formConfig.fields.section.enabled && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        {formConfig.fields.section.label}{' '}
                        {formConfig.fields.section.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={p.section}
                        onChange={(e) => handleParticipantChange(idx, 'section', e.target.value)}
                        placeholder="e.g. CSE-A"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                        required={formConfig.fields.section.required}
                      />
                    </div>
                  )}

                  {/* Custom Fields */}
                  {formConfig.custom_fields &&
                    formConfig.custom_fields.map((cf) => (
                      <div key={cf.id}>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          {cf.label} {cf.required && <span className="text-rose-500">*</span>}
                        </label>
                        <input
                          type={cf.type === 'number' ? 'number' : 'text'}
                          value={p.customFields[cf.id] || ''}
                          onChange={(e) => handleCustomFieldChange(idx, cf.id, e.target.value)}
                          placeholder={`Enter ${cf.label}`}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white"
                          required={cf.required}
                        />
                      </div>
                    ))}

                </div>
              </div>
            ))}
          </div>

          {participants.length < event.max_team_size && (
            <div className="mt-4 text-center sm:hidden">
              <button
                type="button"
                onClick={addParticipant}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                + Add Member
              </button>
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            style={{ backgroundColor: schoolTheme.hex }}
          >
            <span>{isSubmitting ? 'Registering Team...' : 'Complete Registration & Get Passes'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </form>
    </div>
  );
};
