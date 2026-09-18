import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { RegisterPage } from './pages/public/RegisterPage';
import { VolunteerLoginPage } from './pages/volunteer/VolunteerLoginPage';
import { VolunteerScannerPage } from './pages/volunteer/VolunteerScannerPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const MainContent: React.FC = () => {
  const [currentPortal, setCurrentPortal] = useState<'register' | 'volunteer' | 'admin'>('register');
  const { isAuthenticated, isFaculty, isVolunteer } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <Navbar currentPortal={currentPortal} onSelectPortal={setCurrentPortal} />

      <main className="flex-1 pb-16">
        {currentPortal === 'register' && <RegisterPage />}

        {currentPortal === 'volunteer' && (
          isAuthenticated && isVolunteer ? <VolunteerScannerPage /> : <VolunteerLoginPage />
        )}

        {currentPortal === 'admin' && (
          isAuthenticated && isFaculty ? <AdminDashboard /> : <AdminLoginPage />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>ClubGo</strong> • University Event Registration & Attendance Management Platform
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Zero Data-Loss Guaranteed</span>
            <span>•</span>
            <span>Idempotent Check-in Engine</span>
            <span>•</span>
            <span>1000+ Concurrent Capacity</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
