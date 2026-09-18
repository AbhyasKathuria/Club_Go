import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, IdCard, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const CoordinatorLoginPage: React.FC = () => {
  const { loginCoordinator } = useAuth();

  // Login form state (Username + Password)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await loginCoordinator(username.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials or contact the Super Admin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCoordinatorFill = () => {
    setUsername('coordinator1');
    setPassword('20231CSE0001');
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

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Authorized Personnel Only</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Student Co-ordinators
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Entrance Check-in & Fast Attendance Scanner Portal
          </p>
        </div>

        {/* Security Notice */}
        <div className="p-3 mb-5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-start space-x-2">
          <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
          <span>
            Access is strictly restricted to appointed Student Co-ordinators. Accounts are allocated directly by the Super Admin in the Admin Portal.
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Login Form */}
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
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your coordinator password"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Enter the password allocated to you by the Super Admin
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

      </div>
    </div>
  );
};
