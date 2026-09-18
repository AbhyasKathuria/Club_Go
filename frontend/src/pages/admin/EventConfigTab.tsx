import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Event } from '../../types';
import { Save, Rocket, AlertCircle, CheckCircle2, Upload, Globe, Users, Calendar } from 'lucide-react';

export const EventConfigTab: React.FC = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [sponsorLogoUrl, setSponsorLogoUrl] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [allowedDomain, setAllowedDomain] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    loadEvent();
  }, []);

  const loadEvent = async () => {
    try {
      const res = await api.getActiveEvent();
      if (res.event) {
        setEvent(res.event);
        setName(res.event.name || '');
        setDescription(res.event.description || '');
        setSponsorName(res.event.sponsor_name || '');
        setSponsorLogoUrl(res.event.sponsor_logo_url || '');
        setEventDate(
          res.event.event_date ? new Date(res.event.event_date).toISOString().slice(0, 16) : ''
        );
        setMinTeamSize(res.event.min_team_size || 1);
        setMaxTeamSize(res.event.max_team_size || 4);
        setAllowedDomain(res.event.allowed_email_domain || '');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setIsSaving(true);
    setMessage(null);

    try {
      let finalLogoUrl = sponsorLogoUrl;

      // Handle logo upload if a file was selected
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const uploadRes = await api.uploadSponsorLogo(event.id, formData);
        finalLogoUrl = uploadRes.sponsor_logo_url;
      }

      const updated = await api.updateEvent(event.id, {
        name,
        description,
        sponsor_name: sponsorName,
        sponsor_logo_url: finalLogoUrl,
        event_date: eventDate ? new Date(eventDate).toISOString() : undefined,
        min_team_size: minTeamSize,
        max_team_size: maxTeamSize,
        allowed_email_domain: allowedDomain.trim() ? allowedDomain.trim() : null,
      });

      setEvent(updated);
      setSponsorLogoUrl(finalLogoUrl);
      setLogoFile(null);
      setMessage({ type: 'success', text: 'Event settings updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update event' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (newStatus: 'LAUNCHED' | 'CLOSED' | 'DRAFT') => {
    if (!event) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const updated = await api.toggleEventStatus(event.id, newStatus);
      setEvent(updated);
      setMessage({
        type: 'success',
        text: `Event status updated to ${newStatus}. Public registration is now ${
          newStatus === 'LAUNCHED' ? 'ACTIVE' : 'OFFLINE'
        }.`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading event configuration...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Launch/Close Action */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                event?.status === 'LAUNCHED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : event?.status === 'CLOSED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              ● {event?.status}
            </span>
            <span className="text-xs text-slate-500">Public Portal Status</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">{event?.name}</h2>
          <p className="text-xs text-slate-500">
            {event?.status === 'LAUNCHED'
              ? 'Event is published. Students can currently submit registrations.'
              : 'Event registration is currently closed to the public.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {event?.status !== 'LAUNCHED' ? (
            <button
              onClick={() => handleToggleStatus('LAUNCHED')}
              disabled={isSaving}
              className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch Event (Publish)</span>
            </button>
          ) : (
            <button
              onClick={() => handleToggleStatus('CLOSED')}
              disabled={isSaving}
              className="flex items-center space-x-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors"
            >
              <span>Close Registration</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-2.5 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
          Event Details & Rules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Event Date & Time
            </label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Allowed Email Domain (Optional)
            </label>
            <input
              type="text"
              value={allowedDomain}
              onChange={(e) => setAllowedDomain(e.target.value)}
              placeholder="e.g. university.edu (leave blank for any domain)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Min Team Size
            </label>
            <input
              type="number"
              min={1}
              max={maxTeamSize}
              value={minTeamSize}
              onChange={(e) => setMinTeamSize(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Max Team Size
            </label>
            <input
              type="number"
              min={minTeamSize}
              max={10}
              value={maxTeamSize}
              onChange={(e) => setMaxTeamSize(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Sponsor Section */}
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 pt-4">
          Sponsor Branding & Logo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Sponsor Name
            </label>
            <input
              type="text"
              value={sponsorName}
              onChange={(e) => setSponsorName(e.target.value)}
              placeholder="e.g. Google Cloud"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500"
            />

            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mt-4 mb-1">
              Sponsor Logo URL (Persistent Direct Link)
            </label>
            <input
              type="url"
              value={sponsorLogoUrl}
              onChange={(e) => setSponsorLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Or Upload Sponsor Logo File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setLogoFile(e.target.files[0]);
                }
              }}
              className="w-full px-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-xl bg-slate-50 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />

            {sponsorLogoUrl && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Current Logo Preview
                </span>
                <img
                  src={sponsorLogoUrl}
                  alt="Sponsor Logo"
                  className="max-h-12 mx-auto object-contain"
                />
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
