import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { RegisterPage } from './pages/public/RegisterPage';
import { ResultsPublicPage } from './pages/public/ResultsPublicPage';
import { CoordinatorLoginPage } from './pages/volunteer/CoordinatorLoginPage';
import { VolunteerScannerPage as CoordinatorScannerPage } from './pages/volunteer/VolunteerScannerPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const MainContent: React.FC = () => {
  const [currentPortal, setCurrentPortal] = useState<'register' | 'results' | 'coordinator' | 'admin'>('register');
  const { isAuthenticated, isFaculty, isVolunteer } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <Navbar currentPortal={currentPortal} onSelectPortal={setCurrentPortal} />

      <main className="flex-1 pb-16">
        {currentPortal === 'register' && <RegisterPage />}

        {currentPortal === 'results' && <ResultsPublicPage />}

        {currentPortal === 'coordinator' && (
          isAuthenticated && isVolunteer ? <CoordinatorScannerPage /> : <CoordinatorLoginPage />
        )}

        {currentPortal === 'admin' && (
          isAuthenticated && isFaculty ? <AdminDashboard /> : <AdminLoginPage />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          
          {/* Institutional Branding Strip */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-6 sm:gap-10 pb-6 border-b border-slate-100 max-w-2xl mx-auto">
            <div className="flex items-center justify-center">
              <img
                src="/images/Presidency.png"
                alt="Presidency University"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </div>
            
            <div className="flex items-center justify-center">
              <img
                src="/images/DSA NAAC.png"
                alt="DSA NAAC A Accredited"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-center">
              <img
                src="/images/iiclogo.png"
                alt="Institution's Innovation Council"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-center">
              <img
                src="/images/CogniCore Logo.png"
                alt="CogniCore Club"
                className="h-12 sm:h-12 w-auto object-contain drop-shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
            <div className="text-left">
              <div className="font-bold text-slate-800 text-sm">
                Presidency University • CogniCore Club
              </div>
              <div className="text-[11px] text-slate-500">
                Presidency University • Department of Student Affairs (DSA) • Presidency School of Information Science
              </div>
            </div>

            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span>ClubGo Platform</span>
              <span>•</span>
              <span>Zero Data-Loss Engine</span>
              <span>•</span>
              <span>Idempotent Check-in</span>
            </div>
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
