import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  GraduationCap,
  Sparkles,
  Check,
  Menu,
  X,
  UserCheck,
  BookOpen,
  Shield
} from 'lucide-react';

export const Navbar = ({ onToggleMobileSidebar, currentTab, setCurrentTab, onOpenProfileModal }) => {
  const { user, role, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead, markAsRead } = useSocket();

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (r) => {
    switch (r) {
      case 'principal':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Super Admin (Principal)
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            Teacher / Admin
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Student Member
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 dark:border-slate-800/80 bg-white/85 dark:bg-[#070b14]/85 backdrop-blur-md transition-colors duration-200">
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer card-hover" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/25 text-white font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  VidyaCore
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-gradient-to-r from-blue-500/15 to-emerald-500/15 text-blue-600 dark:text-emerald-400 border border-blue-500/20">
                  AI v2.6
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Campus Intelligence & Broadcast Suite
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Institutional Role Status Badge */}
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 shadow-2xs">
            {role === 'principal' ? (
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Super Admin Console</span>
                <span className="sm:hidden">Principal</span>
              </span>
            ) : role === 'teacher' ? (
              <span className="flex items-center gap-1.5 text-blue-700 dark:text-emerald-400 font-bold">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Teacher Hub • Class {user?.className || '10-A'}</span>
                <span className="sm:hidden">Teacher</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Student • Class {user?.className || '—'}</span>
                <span className="sm:hidden">Student</span>
              </span>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme mode"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 animate-in spin-in-180 duration-300" />
            )}
          </button>

          {/* Real-time Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-emerald-300">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-blue-600 dark:text-emerald-400 hover:underline font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => {
                          if (!n.read) markAsRead(n._id);
                          if (n.link === '/channels') setCurrentTab('channels');
                          else if (n.link === '/student/dashboard') setCurrentTab('dashboard');
                          setShowNotifications(false);
                        }}
                        className={`pt-2 cursor-pointer p-2 rounded-lg transition-colors ${
                          n.read
                            ? 'opacity-70 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            : 'bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left group"
              title="View & Edit Academic Profile"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-1 ring-slate-300 dark:ring-slate-600 group-hover:ring-emerald-500 transition-all">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'User'}`}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight group-hover:text-emerald-400 transition-colors">
                  {user?.name}
                </p>
                <div className="mt-0.5">{getRoleBadge(role)}</div>
              </div>
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

