import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { QrCode, Shield, Users, LogOut, Radio, Award } from 'lucide-react';

interface NavbarProps {
  currentPortal: 'register' | 'results' | 'coordinator' | 'admin';
  onSelectPortal: (portal: 'register' | 'results' | 'coordinator' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPortal, onSelectPortal }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isConnected } = useSocket();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand with University & Club Logos */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectPortal('register')}>
          <div className="flex items-center space-x-2">
            <img
              src="/images/Presidency.png"
              alt="Presidency University"
              className="h-9 w-auto object-contain hidden sm:block"
            />
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <img
              src="/images/CogniCore Logo.png"
              alt="CogniCore Club"
              className="h-10 w-auto object-contain drop-shadow-sm"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-black tracking-tight text-slate-900">
                CogniCore <span className="text-blue-600">Club</span>
              </span>
            </div>
            <div className="text-[10px] font-semibold text-slate-500 hidden sm:block leading-none mt-0.5">
              Presidency University
            </div>
          </div>
        </div>

        {/* Portal Switcher Nav */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
          <button
            onClick={() => onSelectPortal('register')}
            className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              currentPortal === 'register'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Register</span>
          </button>

          <button
            onClick={() => onSelectPortal('results')}
            className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              currentPortal === 'results'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
            <span>Results & Certs</span>
          </button>

          <button
            onClick={() => onSelectPortal('coordinator')}
            className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              currentPortal === 'coordinator'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Student Co-ordinators</span>
          </button>

          <button
            onClick={() => onSelectPortal('admin')}
            className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              currentPortal === 'admin'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Admin</span>
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
