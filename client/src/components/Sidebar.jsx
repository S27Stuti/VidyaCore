import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Award,
  Radio,
  Sparkles,
  FileText,
  X
} from 'lucide-react';

export const Sidebar = ({ currentTab, setCurrentTab, isMobileOpen, onCloseMobile }) => {
  const { role, user } = useAuth();

  const getNavItems = () => {
    if (role === 'principal') {
      return [
        { id: 'dashboard', label: 'Executive Analytics', icon: LayoutDashboard },
        { id: 'directory', label: 'Student Directory', icon: Users },
        { id: 'channels', label: 'Broadcast Channels', icon: Radio },
        { id: 'ai-summary', label: 'AI Campus Insights', icon: Sparkles }
      ];
    } else if (role === 'teacher') {
      return [
        { id: 'dashboard', label: 'Teacher Hub', icon: LayoutDashboard },
        { id: 'attendance', label: 'Mark Attendance', icon: CheckSquare },
        { id: 'marks', label: 'Marks & Grading', icon: Award },
        { id: 'channels', label: 'Broadcast Channels', icon: Radio },
        { id: 'directory', label: 'Student Directory', icon: Users }
      ];
    } else {
      // Student
      return [
        { id: 'dashboard', label: 'My Performance', icon: LayoutDashboard },
        { id: 'report-card', label: 'Report Card Summary', icon: FileText },
        { id: 'channels', label: 'Class Announcements', icon: Radio },
        { id: 'ai-coach', label: 'AI Study Coach', icon: Sparkles }
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Desktop & Slide-out Mobile Sidebar */}
      <aside
        className={`fixed md:sticky top-0 md:top-16 z-50 md:z-30 h-full md:h-[calc(100vh-4rem)] w-64 xl:w-72 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-md transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Mobile Header with close button */}
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-slate-800 md:hidden">
            <span className="font-bold text-slate-900 dark:text-white text-sm">Navigation</span>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5 flex-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 card-hover ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/15 to-emerald-500/15 text-blue-600 dark:text-emerald-400 border border-blue-500/30 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white hover:border-emerald-500/30'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isActive ? 'text-blue-600 dark:text-emerald-400 scale-110' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Role / School Info Card at Bottom */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 mt-auto card-hover">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Academic Session 2026-27
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {role === 'student' && user?.className ? `Class: ${user.className} • Roll: ${user.rollNo}` : 'VidyaCore Central Institute'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

