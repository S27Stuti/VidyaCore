import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  GraduationCap,
  BookOpen,
  Shield,
  Sun,
  Moon,
  ArrowRight,
  UserCheck,
  Sparkles,
  Lock,
  Mail,
  User,
  Check,
  AlertCircle,
  Phone,
  Hash,
  School,
  CheckCircle2,
  Radio,
  UserPlus,
  LogIn
} from 'lucide-react';

export const Login = () => {
  const { login, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // 3 Primary Roles: 'student' | 'teacher' | 'principal'
  const [selectedRole, setSelectedRole] = useState('student');
  const [isRegister, setIsRegister] = useState(false);

  // Pre-loaded with Student credentials by default for instant 1-click testing
  const [formData, setFormData] = useState({
    name: '',
    email: 'stutu2004shah@gmail.com',
    password: 'password123',
    phone: '',
    rollNo: '1',
    className: '1',
    subject: '',
    parentContact: '',
    designation: ''
  });

  const [error, setError] = useState('');
  const [notRegisteredWarning, setNotRegisteredWarning] = useState(false);
  const [alreadyRegisteredWarning, setAlreadyRegisteredWarning] = useState(false);
  const [wrongPasswordWarning, setWrongPasswordWarning] = useState(false);
  const [roleMismatchWarning, setRoleMismatchWarning] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectRole = (roleId) => {
    setSelectedRole(roleId);
    setError('');
    setNotRegisteredWarning(false);
    setAlreadyRegisteredWarning(false);
    setWrongPasswordWarning(false);
    setRoleMismatchWarning(null);

    // In Sign In mode, automatically populate the corresponding role's demo credentials
    if (!isRegister) {
      if (roleId === 'principal') {
        setFormData((prev) => ({
          ...prev,
          email: 'principal@vidyacore.edu',
          password: 'password123'
        }));
      } else if (roleId === 'teacher') {
        setFormData((prev) => ({
          ...prev,
          email: 'teacher.verma@vidyacore.edu',
          password: 'password123'
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          email: 'stutu2004shah@gmail.com',
          password: 'password123'
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotRegisteredWarning(false);
    setAlreadyRegisteredWarning(false);
    setWrongPasswordWarning(false);
    setRoleMismatchWarning(null);
    setSuccessMsg('');
    setLoading(true);

    const cleanEmail = (formData.email || '').trim().toLowerCase();
    const cleanPassword = (formData.password || '').trim();

    try {
      if (isRegister) {
        await register({
          ...formData,
          email: cleanEmail,
          password: cleanPassword,
          role: selectedRole,
          profileCompleted: true
        });
      } else {
        await login(cleanEmail, cleanPassword, selectedRole);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed. Please check your credentials.';
      setError(msg);
      if (err.response?.data?.roleMismatch) {
        setRoleMismatchWarning({
          actualRole: err.response.data.actualRole,
          message: msg
        });
      }
      if (err.response?.data?.notRegistered || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('pehle register')) {
        setNotRegisteredWarning(true);
      }
      if (err.response?.data?.alreadyRegistered || msg.toLowerCase().includes('already registered')) {
        setAlreadyRegisteredWarning(true);
      }
      if (err.response?.data?.invalidPassword || msg.toLowerCase().includes('password')) {
        setWrongPasswordWarning(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPasswordReset = async () => {
    const cleanEmail = (formData.email || '').trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email above to reset password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/reset-password', {
        email: cleanEmail,
        newPassword: 'password123'
      });
      setFormData((prev) => ({ ...prev, password: 'password123' }));
      await login(cleanEmail, 'password123');
      setSuccessMsg('Password updated to password123 & Logged In successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    setError('');
    setNotRegisteredWarning(false);
    setAlreadyRegisteredWarning(false);
    setWrongPasswordWarning(false);
    setIsRegister(true);
  };

  const handleSwitchToLogin = () => {
    setError('');
    setNotRegisteredWarning(false);
    setAlreadyRegisteredWarning(false);
    setWrongPasswordWarning(false);
    setIsRegister(false);
  };

  // Autofills demo credentials into the form inputs for authentic role login
  const fillDemoCredentials = () => {
    setIsRegister(false);
    if (selectedRole === 'principal') {
      setFormData((prev) => ({
        ...prev,
        email: 'principal@vidyacore.edu',
        password: 'password123'
      }));
    } else if (selectedRole === 'teacher') {
      setFormData((prev) => ({
        ...prev,
        email: 'teacher.verma@vidyacore.edu',
        password: 'password123'
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        email: 'stutu2004shah@gmail.com',
        password: 'password123'
      }));
    }
    setError('');
    setNotRegisteredWarning(false);
  };

  const roles = [
    {
      id: 'student',
      title: 'Student Portal',
      shortTitle: 'Student',
      description: 'View attendance %, report card summary & AI study plan',
      icon: GraduationCap,
      badge: 'Student Member',
      demoEmail: 'stutu2004shah@gmail.com',
      demoName: 'Stuti Shah (Class 1)',
      accentColor: 'emerald'
    },
    {
      id: 'teacher',
      title: 'Teacher Hub',
      shortTitle: 'Teacher',
      description: 'Daily attendance marking, grade computation & notices',
      icon: BookOpen,
      badge: 'Class & Subject Admin',
      demoEmail: 'teacher.verma@vidyacore.edu',
      demoName: 'Mr. Vikram Verma (Class 10-A Math)',
      accentColor: 'blue'
    },
    {
      id: 'principal',
      title: 'Principal Console',
      shortTitle: 'Principal',
      description: 'Global school pass %, class comparisons & AI Campus...',
      icon: Shield,
      badge: 'Super Admin',
      demoEmail: 'principal@vidyacore.edu',
      demoName: 'Dr. Rajesh Sharma (Head of Institute)',
      accentColor: 'teal'
    }
  ];

  const activeRoleConfig = roles.find((r) => r.id === selectedRole) || roles[0];

  return (
    <div className="min-h-screen min-h-dvh w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-[#060813] text-slate-900 dark:text-slate-100 transition-colors duration-300 relative">
      {/* Floating Theme Switcher Button */}
      <div className="fixed top-4 right-4 z-50 safe-top">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl border-2 border-slate-300/80 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-md text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 shadow-md transition-all cursor-pointer"
          aria-label="Toggle theme mode"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 animate-in spin-in-180 duration-300" />
          )}
        </button>
      </div>

      {/* MOBILE HEADER (Visible on Phone/Tablet only, so user is directly at the login action) */}
      <div className="lg:hidden w-full p-4 pt-6 pb-2 flex flex-col items-center text-center bg-gradient-to-b from-blue-50/80 via-white to-slate-50 dark:from-slate-900/80 dark:via-slate-900/40 dark:to-[#060813] border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                VidyaCore
              </span>
              <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded-md bg-gradient-to-r from-blue-500/15 to-emerald-500/15 text-blue-700 dark:text-emerald-300 border border-blue-500/30">
                v2.6 Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Unified Campus Intelligence Network
            </p>
          </div>
        </div>
      </div>

      {/* DESKTOP LEFT COLUMN: ENTERPRISE SHOWCASE (Hidden on mobile, pristine in light & dark mode) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-5/12 p-8 lg:p-12 flex-col justify-between border-r border-slate-200/90 dark:border-slate-800/80 bg-gradient-to-br from-blue-50/70 via-slate-50/50 to-emerald-50/60 dark:from-blue-950/30 dark:via-slate-900/40 dark:to-emerald-950/20 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Brand Header */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/10">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  VidyaCore
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/15 to-emerald-500/15 text-blue-700 dark:text-emerald-300 border border-blue-500/30">
                  v2.6 Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unified Campus Intelligence & Broadcast Suite
              </p>
            </div>
          </div>

          <div className="pt-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Transforming Academic Governance with <span className="blue-green-text">Precision & Speed</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Real-time daily attendance tracking, automated grade computation, AI circular composition, and zero-leak broadcast channels from Class 1 to 12.
            </p>
          </div>
        </div>

        {/* Middle: Feature Highlights Cards */}
        <div className="relative z-10 my-6 space-y-3">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/70 border-2 border-slate-200/90 dark:border-slate-800 flex items-start gap-3 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">1-Click Fast Attendance Roster</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Mark entire classes present in seconds with instant notification alerts for student & parent accounts.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/70 border-2 border-slate-200/90 dark:border-slate-800 flex items-start gap-3 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Class-Filtered Broadcast Channels</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Teachers post announcements to specific cohorts (1–12) while students strictly receive their own notices.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/70 border-2 border-slate-200/90 dark:border-slate-800 flex items-start gap-3 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Gemini AI Executive Campus Synthesis</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Predictive telemetry flags at-risk students below 75% attendance and generates personalized study roadmaps.
              </p>
            </div>
          </div>
        </div>

        {/* Live System Telemetry Strip */}
        <div className="relative z-10 grid grid-cols-3 gap-2 py-3 px-2 rounded-2xl bg-white dark:bg-slate-900/60 border-2 border-slate-200/90 dark:border-slate-800 my-2 shadow-xs">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Cohorts</p>
            <p className="text-sm font-black text-blue-600 dark:text-emerald-400">Classes 1–12</p>
          </div>
          <div className="text-center border-x border-slate-200 dark:border-slate-800">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Sync Speed</p>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">Real-Time</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">AI Assistant</p>
            <p className="text-sm font-black text-teal-600 dark:text-teal-400">Gemini 2.5</p>
          </div>
        </div>

        {/* Bottom Institutional Assurance */}
        <div className="relative z-10 pt-4 border-t border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Academic Year 2026–27</span>
          <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Enterprise Node Active
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: MAIN AUTHENTICATION CONSOLE (Full width on mobile, 7/12 on desktop) */}
      <div className="w-full lg:w-7/12 xl:w-7/12 p-4 sm:p-8 lg:p-12 flex flex-col justify-center relative">
        <div className="max-w-xl w-full mx-auto space-y-5">
          {/* STEP 1: ROLE SELECTOR */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-emerald-400" />
                <span>Select Institutional Role</span>
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-emerald-400">
                {activeRoleConfig.title}
              </span>
            </div>

            {/* RESPONSIVE ROLE CARDS: 3-column compact on mobile, rich cards on desktop */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 items-stretch">
              {roles.map((r) => {
                const isSelected = selectedRole === r.id;
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRole(r.id)}
                    className={`relative text-left p-2.5 sm:p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[75px] sm:min-h-[140px] ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-[#0c1322] border-emerald-500 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/10 -translate-y-0.5'
                        : 'bg-white dark:bg-[#080d1a] border-slate-200/90 dark:border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-[#0e1628] shadow-xs'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                      </div>
                    )}

                    <div className="space-y-1 sm:space-y-2">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <p className={`font-bold text-xs truncate transition-colors ${
                          isSelected
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          <span className="sm:hidden">{r.shortTitle}</span>
                          <span className="hidden sm:inline">{r.title}</span>
                        </p>
                        <p className={`hidden sm:block text-[11px] mt-1 leading-relaxed line-clamp-2 transition-colors ${
                          isSelected
                            ? 'text-slate-600 dark:text-slate-300'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {r.description}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:block mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/70">
                      <span className={`text-[9px] uppercase font-bold tracking-wider transition-colors ${
                        isSelected
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        {r.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Demo Credentials Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-900/50 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-emerald-400 shrink-0" />
              <span className="text-[11px] text-slate-800 dark:text-slate-200">
                <strong>Demo Test:</strong> {activeRoleConfig.demoName}
              </span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full sm:w-auto px-3 py-1.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-sm transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 active:scale-95"
            >
              <span>⚡ Autofill Demo Credentials</span>
            </button>
          </div>

          {/* STEP 2: MAIN AUTHENTICATION FORM (SIGN IN DEFAULT OR REGISTER) */}
          <div className="rounded-3xl p-5 sm:p-8 bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 shadow-xl">
            {/* Top Navigation Tabs: Sign In (Default) vs Register */}
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-5 border-2 border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={handleSwitchToLogin}
                className={`h-11 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  !isRegister
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to {activeRoleConfig.shortTitle}</span>
              </button>
              <button
                type="button"
                onClick={handleSwitchToRegister}
                className={`h-11 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isRegister
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Register &amp; Profile</span>
              </button>
            </div>

            {/* ROLE MISMATCH RECOVERY BANNER */}
            {roleMismatchWarning && (
              <div className="mb-5 p-4 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/40 border-2 border-indigo-500/50 text-indigo-900 dark:text-indigo-200 text-xs space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Role Mismatch Detected!</p>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-0.5">
                      {roleMismatchWarning.message}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectRole(roleMismatchWarning.actualRole);
                    setRoleMismatchWarning(null);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>
                    👉 Switch to {roleMismatchWarning.actualRole === 'principal' ? 'Principal Console' : roleMismatchWarning.actualRole === 'teacher' ? 'Teacher Hub' : 'Student Portal'} &amp; Sign In
                  </span>
                </button>
              </div>
            )}

            {/* REGISTER FIRST WARNING BANNER WHEN UNREGISTERED USER TRIES TO LOGIN */}
            {notRegisteredWarning && (
              <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border-2 border-amber-500/50 text-amber-900 dark:text-amber-200 text-xs space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Account Not Found!</p>
                    <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                      Pehle register karein, uske baad login karein (Please create your profile first before signing in).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchToRegister}
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Click Here to Register as {activeRoleConfig.title} &rarr;</span>
                </button>
              </div>
            )}

            {/* ALREADY REGISTERED BANNER ON REGISTER TAB */}
            {alreadyRegisteredWarning && isRegister && (
              <div className="mb-5 p-4 rounded-2xl bg-blue-500/10 dark:bg-blue-950/40 border-2 border-blue-500/50 text-blue-900 dark:text-blue-200 text-xs space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Account Already Exists!</p>
                    <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5">
                      Ye email pehle se registered hai. Aap seedha Sign In karein.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Switch to Sign In & Enter Password &rarr;</span>
                </button>
              </div>
            )}

            {/* WRONG PASSWORD RECOVERY BANNER */}
            {wrongPasswordWarning && !isRegister && (
              <div className="mb-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs space-y-2 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Incorrect Password Entered</p>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                      Check your password or click below to reset it to <strong>password123</strong> and sign in right away.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickPasswordReset}
                  className="w-full py-2 px-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ Quick Reset Password to "password123" &amp; Sign In</span>
                </button>
              </div>
            )}

            {/* STANDARD ERROR BANNER */}
            {error && !notRegisteredWarning && !alreadyRegisteredWarning && !wrongPasswordWarning && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS BANNER */}
            {successMsg && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* REGISTRATION SPECIFIC FIELDS (ONLY VISIBLE IN REGISTER TAB) */}
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      Full Legal Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Diya Sharma"
                        className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-semibold shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* STUDENT REGISTRATION SPECIFIC FIELDS */}
                  {selectedRole === 'student' && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                            Class Cohort (1 to 12) <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              value={formData.className}
                              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                              placeholder="e.g. 1, 10-A, 12-B"
                              className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-semibold shadow-2xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                            Roll Number <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              value={formData.rollNo}
                              onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                              placeholder="e.g. 101, 1"
                              className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-semibold shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                            Student Phone <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+91 98000 00000"
                              className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-semibold shadow-2xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                            Parent Contact <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              value={formData.parentContact}
                              onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                              placeholder="+91 98000 99999"
                              className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-semibold shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* TEACHER REGISTRATION SPECIFIC FIELDS */}
                  {selectedRole === 'teacher' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                          Assigned Class <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={formData.className}
                            onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                            placeholder="e.g. 1, 10-A, 12-B"
                            className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-semibold shadow-2xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                          Faculty Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-semibold shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PRINCIPAL REGISTRATION SPECIFIC FIELDS */}
                  {selectedRole === 'principal' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                          Administrative Designation <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={formData.designation || ''}
                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                            placeholder="e.g. Principal & Head of Institute"
                            className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-semibold shadow-2xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                          Office Phone <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+91 98000 11111"
                            className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-semibold shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* COMMON: EMAIL & PASSWORD */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Institutional Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={activeRoleConfig.demoEmail}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-semibold shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-semibold shadow-2xs"
                  />
                </div>
              </div>

              {/* ACTION SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {isRegister
                        ? `Complete Registration & Enter ${activeRoleConfig.title.split(' ')[0]} Portal`
                        : `Sign In to ${activeRoleConfig.title}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Footer */}
            <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5 truncate max-w-full">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Demo Account:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold truncate">{activeRoleConfig.demoEmail}</span>
              </span>

              <button
                type="button"
                onClick={fillDemoCredentials}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-emerald-300 border-2 border-blue-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-blue-100 transition-all cursor-pointer whitespace-nowrap"
              >
                ⚡ Fill Credentials
              </button>
            </div>
          </div>

          {/* MOBILE ONLY: FEATURE CARDS BELOW LOGIN (So mobile users log in immediately) */}
          <div className="lg:hidden space-y-3 pt-2">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
              Institutional Platform Capabilities
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 flex items-start gap-2.5 shadow-xs">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">1-Click Fast Attendance Roster</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Mark entire classes present in seconds with instant notification alerts for student accounts.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 flex items-start gap-2.5 shadow-xs">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Class-Filtered Broadcast Channels</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Teachers post announcements to specific cohorts (1–12) while students strictly receive their own notices.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-500" /> 256-Bit SSL Encryption
            </span>
            <span>&bull;</span>
            <span>Role-Based Access</span>
            <span>&bull;</span>
            <span>Demo Password: <strong className="font-mono text-slate-700 dark:text-slate-300">password123</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
