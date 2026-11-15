import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import {
  Users,
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  Award,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';

export const PrincipalDashboard = ({ setCurrentTab }) => {
  const { socket } = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [marksRes, attRes, aiRes] = await Promise.all([
        api.get('/marks/analytics'),
        api.get('/attendance/stats'),
        api.get('/ai/campus-summary')
      ]);

      setAnalytics(marksRes.data);
      setAttendanceStats(attRes.data);
      setAiSummary(aiRes.data);
    } catch (err) {
      console.error('Error fetching principal analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAi = async () => {
    setAiLoading(true);
    try {
      const res = await api.get('/ai/campus-summary');
      setAiSummary(res.data);
    } catch (err) {
      console.error('Failed to regenerate AI summary', err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!socket) return;
    const handleUpdate = () => {
      fetchData();
    };

    socket.on('attendance_updated', handleUpdate);
    socket.on('marks_updated', handleUpdate);

    return () => {
      socket.off('attendance_updated', handleUpdate);
      socket.off('marks_updated', handleUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Aggregating Institutional Telemetry...</p>
        </div>
      </div>
    );
  }

  const passPct = analytics?.overallPassPercentage ?? 0;
  const avgAtt = attendanceStats?.overallPercentage ?? 0;
  const atRiskCount = aiSummary?.stats?.atRiskCount || 0;
  const totalStudents = aiSummary?.stats?.totalStudents || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner with date & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Institutional Intelligence Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Super Admin Console
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-class academic evaluation, attendance tracking, and predictive governance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all card-hover"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Stats</span>
          </button>
          <button
            onClick={() => setCurrentTab('channels')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-sm transition-all card-hover"
          >
            <span>Broadcast Circular</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Pass Rate */}
        <div className="p-4 rounded-2xl glass-card card-hover bg-white/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">School Pass Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{passPct}%</div>
            <p className="text-[11px] font-medium mt-0.5">
              {passPct > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Term Academic Pass
                </span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">Awaiting exam evaluations (0%)</span>
              )}
            </p>
          </div>
        </div>

        {/* Attendance */}
        <div className="p-4 rounded-2xl glass-card card-hover bg-white/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Attendance</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{avgAtt}%</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {attendanceStats?.totalRecords > 0
                ? `Across ${attendanceStats?.classBreakdown?.length || 1} evaluated classes`
                : 'Awaiting faculty attendance entry'}
            </p>
          </div>
        </div>

        {/* Enrolled Students */}
        <div className="p-4 rounded-2xl glass-card card-hover bg-white/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Students</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalStudents}</div>
            <p className="text-[11px] text-blue-600 dark:text-emerald-400 font-medium cursor-pointer hover:underline mt-0.5" onClick={() => setCurrentTab('directory')}>
              View Directory &rarr;
            </p>
          </div>
        </div>

        {/* At-Risk Students */}
        <div className="p-4 rounded-2xl glass-card card-hover bg-white/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">At-Risk Students</span>
            <div className={`p-2 rounded-xl ${atRiskCount > 0 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold ${atRiskCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{atRiskCount}</div>
            <p className="text-[11px] font-medium mt-0.5">
              {atRiskCount > 0 ? (
                <span className="text-rose-600 dark:text-rose-400">Sub-75% att. or failing marks</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400">No at-risk students</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* AI Campus Summary Card */}
      <div className="p-5 rounded-2xl glass-panel card-hover bg-gradient-to-br from-blue-500/5 via-emerald-500/5 to-transparent border border-blue-500/20 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-blue-500/15">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                AI Campus Summary & Executive Recommendations
              </h2>
              <p className="text-xs text-slate-500">Autonomous synthesis of student grades & attendance telemetry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                aiSummary?.summary?.healthIndex === 'Optimal'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : aiSummary?.summary?.healthIndex === 'Initial Baseline'
                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              }`}
            >
              Status: {aiSummary?.summary?.healthIndex || 'Initial Baseline'}
            </span>
            <button
              onClick={refreshAi}
              disabled={aiLoading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors"
              title="Regenerate with AI"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
            {aiSummary?.summary?.executiveOverview}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top performing classes */}
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 card-hover">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                <Award className="w-4 h-4" />
                <span>Top Performing Cohorts</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {aiSummary?.summary?.topPerformingClasses?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas of concern */}
            <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 card-hover">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Identified Concerns</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {aiSummary?.summary?.concerns?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended actions */}
            <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 card-hover">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Governance Action Items</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {aiSummary?.summary?.recommendedActions?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold">&bull;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class-wise Result Comparison */}
        <div className="p-5 rounded-2xl glass-panel card-hover bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Class-wise Overall Result Percentages
              </h3>
              <p className="text-xs text-slate-500">Comparison of pass rates and average scores across classes</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {analytics?.classWiseResults && analytics.classWiseResults.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.classWiseResults} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="passPercentage" name="Pass %" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avgMarks" name="Avg Score %" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60">
                <GraduationCap className="w-8 h-8 text-blue-500/40 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Awaiting Examination Marks</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Once teachers enter unit test or term marks in Teacher Hub, class comparison charts will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Trends */}
        <div className="p-5 rounded-2xl glass-panel card-hover bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                7-Day School Attendance Trends
              </h3>
              <p className="text-xs text-slate-500">Daily overall institutional presence percentage</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {attendanceStats?.totalRecords > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceStats?.dayTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                    formatter={(val) => [`${val}%`, 'Attendance Rate']}
                  />
                  <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#attGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60">
                <CheckCircle className="w-8 h-8 text-emerald-500/40 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Awaiting Daily Attendance</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Once teachers mark attendance in Teacher Hub, 7-day trend analysis will render here in real time.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subject-wise Marks Distribution */}
        <div className="p-5 rounded-2xl glass-panel card-hover bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Subject-wise Marks Distribution
              </h3>
              <p className="text-xs text-slate-500">Average, highest, and lowest performance scores per discipline</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {analytics?.subjectDistribution && analytics.subjectDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.subjectDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="highest" name="Highest Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="averageMarks" name="Class Average" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lowest" name="Lowest Score" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60">
                <Award className="w-8 h-8 text-blue-500/40 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Awaiting Subject Grade Entries</p>
                <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                  Discipline score metrics will appear automatically as faculty members evaluate student exam submissions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

