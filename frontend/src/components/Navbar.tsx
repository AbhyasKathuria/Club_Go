import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { QrCode, Shield, Users, LogOut, Radio } from 'lucide-react';

interface NavbarProps {
  currentPortal: 'register' | 'volunteer' | 'admin';
  onSelectPortal: (portal: 'register' | 'volunteer' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPortal, onSelectPortal }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectPortal('register')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
            C
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              Club<span className="text-blue-600">Go</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full border border-slate-200">
              Campus Events
            </span>
          </div>
        </div>

        {/* Portal Switcher Nav */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
          <button
            onClick={() => onSelectPortal('register')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentPortal === 'register'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Register</span>
          </button>

          <button
            onClick={() => onSelectPortal('volunteer')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentPortal === 'volunteer'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Volunteer Scanner</span>
          </button>

          <button
            onClick={() => onSelectPortal('admin')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentPortal === 'admin'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Panel</span>
          </button>
        </nav>

        {/* Right Info: WebSocket status & Auth user */}
        <div className="flex items-center space-x-3">
          {/* Real-time Indicator */}
          <div
            title={isConnected ? 'Live WebSocket Connected' : 'Connecting to real-time server...'}
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium"
          >
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`} />
            <span className={isConnected ? 'text-emerald-700' : 'text-amber-700'}>
              {isConnected ? 'Live' : 'Syncing'}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center space-x-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</div>
                <div className="text-[10px] font-semibold text-blue-600 tracking-wider uppercase">
                  {user?.role}
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>

      </div>
    </header>
  );
};
