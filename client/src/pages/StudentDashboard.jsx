import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import {
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
  Download,
  Printer,
  TrendingUp,
  Clock,
  BookOpen,
  ArrowRight,
  X,
  GraduationCap,
  RefreshCw
} from 'lucide-react';

export const StudentDashboard = ({ setCurrentTab }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [marksSummary, setMarksSummary] = useState(null);
  const [coachPlan, setCoachPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  const fetchStudentData = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const [attRes, marksRes, coachRes] = await Promise.all([
        api.get(`/attendance/student/${user._id}`),
        api.get(`/marks/student/${user._id}`),
        api.get(`/ai/student-coach/${user._id}`)
      ]);

      setAttendanceSummary(attRes.data.summary);
      setMarksSummary(marksRes.data);
      setCoachPlan(coachRes.data.coachPlan);
    } catch (err) {
      console.error('Failed to load student dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();

    if (!socket) return;
    const handleLiveUpdate = () => {
      fetchStudentData();
    };

    socket.on('attendance_updated', handleLiveUpdate);
    socket.on('marks_updated', handleLiveUpdate);
    socket.on('new_notification', handleLiveUpdate);

    return () => {
      socket.off('attendance_updated', handleLiveUpdate);
      socket.off('marks_updated', handleLiveUpdate);
      socket.off('new_notification', handleLiveUpdate);
    };
  }, [user?._id, socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Academic Transcript...</p>
        </div>
      </div>
    );
  }

  const totalDays = attendanceSummary?.totalDays || 0;
  const attendancePct = totalDays > 0 ? (attendanceSummary?.percentage || 0) : 0;
  const isAttendanceWarning = totalDays > 0 && attendancePct < 75;
  const hasNoAttendance = totalDays === 0;
  const marksList = marksSummary?.marks || [];
  const hasNoMarks = marksList.length === 0;
  const overallGrade = hasNoMarks ? '—' : (marksSummary?.summary?.overallGrade || 'B');
  const overallPct = hasNoMarks ? 0 : (marksSummary?.summary?.overallPercentage || 0);

  return (
    <div className="space-y-6">
      {/* Attendance Warning Banner if < 75% */}
      {isAttendanceWarning && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-800 dark:text-rose-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">ATTENDANCE DEFICIT ALERT</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                  {attendancePct}% &lt; 75% Required
                </span>
              </div>
              <p className="text-xs mt-0.5 opacity-90">
                Your current attendance is strictly below the mandatory 75% board examination eligibility threshold. Immediate attendance in morning lectures is required to avoid debarment.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentTab('ai-coach')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shrink-0 transition-colors"
          >
            Review AI Action Plan
          </button>
        </div>
      )}

      {/* Top Welcome Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-5 rounded-2xl glass-panel bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {user?.name}
            </h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500/15 to-emerald-500/15 text-blue-700 dark:text-emerald-300 border border-emerald-500/30 font-mono">
              Class {user?.className || '—'} • Roll: {user?.rollNo || '—'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mid-Semester academic progress report and dynamic revision timetable.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchStudentData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
            title="Refresh academic data from server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setShowReportCardModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Report Card</span>
          </button>
        </div>
      </div>

      {/* Academic Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Card */}
        <div
          className={`p-4 rounded-2xl glass-card card-hover border flex flex-col justify-between ${
            isAttendanceWarning
              ? 'bg-rose-500/5 border-rose-500/30'
              : 'bg-white/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Overall Attendance
            </span>
            <div
              className={`p-2 rounded-xl ${
                isAttendanceWarning
                  ? 'bg-rose-500/20 text-rose-600'
                  : 'bg-emerald-500/10 text-emerald-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold ${
                  isAttendanceWarning ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}
              >
                {attendancePct}%
              </span>
              <span className="text-[11px] text-slate-400">
                {hasNoAttendance
                  ? '(No days marked yet)'
                  : `(${attendanceSummary?.presentCount} Present / ${totalDays} Days)`}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  isAttendanceWarning ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, attendancePct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Overall Percentage */}
        <div className="p-4 rounded-2xl glass-card card-hover bg-white/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Overall Score</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{overallPct}%</div>
            <p className="text-[11px] text-slate-500 mt-1">
              {hasNoMarks
                ? 'No examination marks recorded yet'
                : `Total: ${marksSummary?.summary?.totalMarksObtained} / ${marksSummary?.summary?.totalMaxMarks} Marks`}
            </p>
          </div>
        </div>

        {/* Cumulative Grade */}
        <div className="p-4 rounded-2xl glass-card card-hover bg-white/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Assigned Grade</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-600 dark:text-emerald-400">
              Grade {overallGrade}
            </div>
            <p className="text-[11px] font-medium mt-1">
              {hasNoMarks ? (
                <span className="text-slate-500 dark:text-slate-400">Awaiting Faculty Evaluation</span>
              ) : marksSummary?.summary?.passed ? (
                <span className="text-emerald-600 dark:text-emerald-400">Passed with Good Standing</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">Remedial Plan Required</span>
              )}
            </p>
          </div>
        </div>

        {/* Evaluated Subjects */}
        <div className="p-4 rounded-2xl glass-card card-hover bg-white/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Evaluated Papers</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {marksList.length} Subjects
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {hasNoMarks ? 'Pending teacher entry' : 'Midterm Examination 2026'}
            </p>
          </div>
        </div>
      </div>

      {/* Subject-Wise Marks Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Subject-Wise Performance Breakdown
          </h2>
          <span className="text-xs text-slate-400">
            {hasNoMarks ? 'Waiting for Teacher Evaluation' : 'Official Academic Record'}
          </span>
        </div>

        {hasNoMarks ? (
          <div className="p-8 rounded-2xl glass-panel bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-center space-y-2 card-hover">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No Marks Recorded Yet (0% / 0 Subjects)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Your subject teacher has not submitted examination marks for your profile yet. Once marks are entered, your subject cards, percentage, and report card will be dynamically generated.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marksList.map((m) => {
              const isFailing = m.marksObtained < 40;
              return (
                <div
                  key={m._id}
                  className={`p-4 rounded-2xl glass-card card-hover border transition-all ${
                    isFailing
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{m.subject}</h3>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">{m.examType}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                        isFailing
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          : m.grade === 'A+' || m.grade === 'A'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      Grade {m.grade}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {m.marksObtained}
                        <span className="text-xs font-normal text-slate-400"> / {m.maxMarks}</span>
                      </span>
                      <span className="text-xs font-bold text-blue-600 dark:text-emerald-400">
                        {m.percentage}%
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isFailing ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-600 to-emerald-500'
                        }`}
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>
                  </div>

                  {m.remarks && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 italic">
                      "{m.remarks}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STUDENT AI PERFORMANCE COACH WIDGET */}
      {coachPlan && (
        <div className="p-5 rounded-2xl glass-panel bg-gradient-to-br from-blue-500/5 via-emerald-500/5 to-transparent border border-blue-500/20 shadow-md card-hover">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-blue-500/15">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Student AI Performance Coach
              </h2>
              <p className="text-xs text-slate-500">Autonomous weak-subject analysis & personalized study plan</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              <p className="text-xs font-semibold text-blue-600 dark:text-emerald-400 mb-1">
                {coachPlan.greeting}
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {coachPlan.summary}
              </p>
              {coachPlan.attendanceNote && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
                  {coachPlan.attendanceNote}
                </p>
              )}
            </div>

            {/* Timetable grid */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Focused Weekly Revision Plan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {coachPlan.weeklyStudyPlan?.map((plan, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 card-hover"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-emerald-400 uppercase">
                      <span>{plan.day}</span>
                      <span className="flex items-center gap-0.5 text-slate-400">
                        <Clock className="w-3 h-3" /> {plan.duration}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {plan.subject}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {plan.technique}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] italic text-slate-400 text-center">
              {coachPlan.motivationalQuote}
            </p>
          </div>
        </div>
      )}

      {/* OFFICIAL REPORT CARD SUMMARY MODAL (PRINTABLE / DOWNLOADABLE) */}
      {showReportCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-7 shadow-2xl max-h-[90dvh] overflow-y-auto">
            {/* Modal Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6 print:hidden">
              <span className="text-xs font-semibold text-slate-400">
                Official Institutional Academic Transcript
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-sm transition-all card-hover"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Transcript</span>
                </button>
                <button
                  onClick={() => setShowReportCardModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div id="printable-report-card" className="space-y-6 text-slate-900 dark:text-white">
              {/* Institution Header */}
              <div className="text-center pb-6 border-b-2 border-indigo-600/30">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-2 shadow-md">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  VIDYACORE ACADEMY OF EXCELLENCE
                </h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                  Academic Progress Report • Session 2026-27
                </p>
              </div>

              {/* Student Metadata Table */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Student Name:</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{user?.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Roll Number:</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{user?.rollNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Cohort / Class:</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{user?.className}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Institutional Attendance:</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{attendancePct}% ({attendanceSummary?.totalDays} days tracked)</p>
                </div>
              </div>

              {/* Official Marks Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Subject Name</th>
                      <th className="py-2.5 px-3">Exam</th>
                      <th className="py-2.5 px-3">Max Marks</th>
                      <th className="py-2.5 px-3">Marks Scored</th>
                      <th className="py-2.5 px-3">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {marksList.map((m) => (
                      <tr key={m._id}>
                        <td className="py-2.5 px-3 font-semibold">{m.subject}</td>
                        <td className="py-2.5 px-3 text-slate-500">{m.examType}</td>
                        <td className="py-2.5 px-3 text-slate-500">{m.maxMarks}</td>
                        <td className="py-2.5 px-3 font-bold">{m.marksObtained} ({m.percentage}%)</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{m.grade}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold border-t border-slate-200 dark:border-slate-700">
                    <tr>
                      <td colSpan={2} className="py-3 px-3 uppercase text-xs">Overall Total</td>
                      <td className="py-3 px-3">{marksSummary?.summary?.totalMaxMarks}</td>
                      <td className="py-3 px-3 text-indigo-600 dark:text-indigo-400">
                        {marksSummary?.summary?.totalMarksObtained} ({overallPct}%)
                      </td>
                      <td className="py-3 px-3 font-black text-indigo-600 dark:text-indigo-400">
                        {overallGrade}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-10 mt-8 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="text-center">
                  <div className="h-10 border-b border-dashed border-slate-400 mx-8 mb-1" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Class Teacher Signature</p>
                </div>
                <div className="text-center">
                  <div className="h-10 border-b border-dashed border-slate-400 mx-8 mb-1" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Principal & Controller of Exams</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

