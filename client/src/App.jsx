import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import {
  LayoutDashboard,
  CheckSquare,
  Award,
  Radio,
  Sparkles,
  Users,
  FileText
} from 'lucide-react';

import { Login } from './pages/Login';
import { PrincipalDashboard } from './pages/PrincipalDashboard';
import { StudentDirectory } from './pages/StudentDirectory';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { BroadcastChannels } from './pages/BroadcastChannels';
import { AiStudyCoach } from './pages/AiStudyCoach';

function MainLayout() {
  const { user, isAuthenticated, loading, role } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Guarantee that whenever a user signs in, switches role, or changes account,
  // they ALWAYS land directly on their designated role Dashboard!
  useEffect(() => {
    setCurrentTab('dashboard');
  }, [user?._id, role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070f] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Initializing VidyaCore...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // If user profile is not completed, display mandatory Onboarding Profile Setup modal!
  const needsProfileSetup = !user?.profileCompleted;

  // Render role-appropriate content
  const renderContent = () => {
    if (role === 'principal') {
      switch (currentTab) {
        case 'dashboard':
          return <PrincipalDashboard setCurrentTab={setCurrentTab} />;
        case 'directory':
          return <StudentDirectory />;
        case 'channels':
          return <BroadcastChannels />;
        case 'ai-summary':
          return <PrincipalDashboard setCurrentTab={setCurrentTab} />;
        default:
          return <PrincipalDashboard setCurrentTab={setCurrentTab} />;
      }
    } else if (role === 'teacher') {
      switch (currentTab) {
        case 'dashboard':
        case 'attendance':
        case 'marks':
          return <TeacherDashboard setCurrentTab={setCurrentTab} />;
        case 'directory':
          return <StudentDirectory />;
        case 'channels':
          return <BroadcastChannels />;
        default:
          return <TeacherDashboard setCurrentTab={setCurrentTab} />;
      }
    } else {
      // Student
      switch (currentTab) {
        case 'dashboard':
        case 'report-card':
          return <StudentDashboard setCurrentTab={setCurrentTab} />;
        case 'channels':
          return <BroadcastChannels />;
        case 'ai-coach':
          return <AiStudyCoach />;
        default:
          return <StudentDashboard setCurrentTab={setCurrentTab} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-[#05070f] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <ToastContainer />

      {/* Mandatory Onboarding Profile Setup Modal */}
      <ProfileSetupModal
        isOpen={needsProfileSetup || isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        isEditMode={!needsProfileSetup && isProfileModalOpen}
      />

      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      <div className="w-full flex min-h-[calc(100vh-4rem)]">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 w-full min-w-0 p-2.5 sm:p-5 lg:p-7 xl:p-8 pb-28 sm:pb-24 md:pb-10 transition-all">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Ultra-responsive iOS & Android Tab Bar with Safe-Area Insets) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800/90 px-1 sm:px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl safe-bottom">
        {role === 'teacher' && (
          <>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'dashboard'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Hub</span>
            </button>
            <button
              onClick={() => setCurrentTab('attendance')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'attendance'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Attendance</span>
            </button>
            <button
              onClick={() => setCurrentTab('marks')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'marks'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Award className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Marks</span>
            </button>
            <button
              onClick={() => setCurrentTab('channels')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'channels'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Notices</span>
            </button>
            <button
              onClick={() => setCurrentTab('directory')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'directory'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Students</span>
            </button>
          </>
        )}
        {role === 'student' && (
          <>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'dashboard'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentTab('report-card')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'report-card'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Report</span>
            </button>
            <button
              onClick={() => setCurrentTab('channels')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'channels'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Notices</span>
            </button>
            <button
              onClick={() => setCurrentTab('ai-coach')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'ai-coach'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">AI Coach</span>
            </button>
          </>
        )}
        {role === 'principal' && (
          <>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'dashboard'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Analytics</span>
            </button>
            <button
              onClick={() => setCurrentTab('directory')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'directory'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Directory</span>
            </button>
            <button
              onClick={() => setCurrentTab('channels')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'channels'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Radio className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">Broadcast</span>
            </button>
            <button
              onClick={() => setCurrentTab('ai-summary')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                currentTab === 'ai-summary'
                  ? 'text-blue-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 tracking-tight">AI Insights</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <MainLayout />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
