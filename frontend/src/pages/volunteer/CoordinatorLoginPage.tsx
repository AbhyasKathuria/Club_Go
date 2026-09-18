import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { QrCode, Lock, User, IdCard, AlertCircle, CheckCircle2, ArrowRight, Sparkles, Clock } from 'lucide-react';

export const CoordinatorLoginPage: React.FC = () => {
  const { loginCoordinator } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state (Username + Roll Number)
  const [username, setUsername] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRoll, setRegRoll] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSchool, setRegSchool] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await loginCoordinator(username.trim(), rollNumber.trim());
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials or check approval status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsRegistering(true);

    try {
      const res = await api.registerCoordinator({
        name: regName.trim(),
        username: regUsername.trim(),
        roll_number: regRoll.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim() || undefined,
        school_name: regSchool.trim() || undefined,
      });

      setMessage(res.message || 'Registration submitted! Please await Super Admin approval.');
      setMode('login');
      setUsername(regUsername.trim());
      setRollNumber(regRoll.trim());
      setRegName('');
      setRegUsername('');
      setRegRoll('');
      setRegEmail('');
      setRegPhone('');
      setRegSchool('');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleQuickCoordinatorFill = () => {
    setUsername('coordinator1');
    setRollNumber('20231CSE0001');
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-md">
        
        {/* Logos & Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src="/images/Presidency.png" alt="Presidency University" className="h-7 w-auto object-contain" />
            <div className="h-5 w-px bg-slate-200" />
            <img src="/images/CogniCore Logo.png" alt="CogniCore Club" className="h-8 w-auto object-contain" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Student Co-ordinators
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Entrance Check-in & Fast Attendance Scanner Portal
          </p>
        </div>

        {/* Tab Switcher: Login vs Request Access */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200/80">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); setMessage(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Co-ordinator Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); setMessage(null); }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Request Access
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>{message}</div>
          </div>
        )}

        {/* Mode: Login (Username + Roll Number) */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. coordinator1"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                University Roll Number
              </label>
              <div className="relative">
                <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 20231CSE0001"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 uppercase font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Access is restricted to approved student co-ordinators
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Scanner'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Fill */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={handleQuickCoordinatorFill}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline decoration-dotted"
              >
                Use Demo Student Co-ordinator (coordinator1 / 20231CSE0001)
              </button>
            </div>
          </form>
        ) : (
          /* Mode: Register */
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Priyesh Kumar"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. priyesh_k"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number</label>
                <input
                  type="text"
                  value={regRoll}
                  onChange={(e) => setRegRoll(e.target.value)}
                  placeholder="e.g. 20231CSE0502"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 uppercase font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">University Email</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="priyesh.k@university.edu"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Faculty / School</label>
                <input
                  type="text"
                  value={regSchool}
                  onChange={(e) => setRegSchool(e.target.value)}
                  placeholder="e.g. SOCSE"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start space-x-1.5">
              <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
              <span>
                Your request will be submitted to the Super Admin for approval before scanner access is granted.
              </span>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isRegistering ? 'Submitting...' : 'Submit Co-ordinator Request'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
