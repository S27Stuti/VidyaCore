import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from 'lucide-react';

export const AiStudyCoach = () => {
  const { user } = useAuth();
  const [coachData, setCoachData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoach = async () => {
      if (!user?._id) return;
      try {
        const res = await api.get(`/ai/student-coach/${user._id}`);
        setCoachData(res.data);
      } catch (err) {
        console.error('Failed to load AI study coach', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoach();
  }, [user?._id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Generating Personalized AI Study Strategies...</p>
        </div>
      </div>
    );
  }

  const plan = coachData?.coachPlan;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl glass-panel bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-teal-500/5 border border-blue-500/20 shadow-md card-hover">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Student AI Performance Coach & Study Timetable
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized syllabus analysis, weak-area diagnostic, and active-recall schedule.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 mt-4">
          <p className="text-sm font-bold text-blue-600 dark:text-emerald-400 mb-1">
            {plan?.greeting}
          </p>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {plan?.summary}
          </p>
          {plan?.attendanceNote && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
              {plan.attendanceNote}
            </p>
          )}
        </div>
      </div>

      {/* Priority Focus Areas */}
      <div className="p-5 rounded-2xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Target Focus Directives
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plan?.priorityAreas?.map((area, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 card-hover"
            >
              <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p>{area}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Structured Weekly Schedule */}
      <div className="p-5 rounded-2xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Structured Weekly Revision Routine
            </h2>
            <p className="text-xs text-slate-500">Optimized for spaced repetition & retention</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plan?.weeklyStudyPlan?.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl glass-card card-hover border border-slate-200/70 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
                  <span>{item.day}</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" /> {item.duration}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.subject}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {item.technique}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>Recommended Priority</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Motivational Quote Banner */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-center text-xs text-slate-500 dark:text-slate-400 italic">
        {plan?.motivationalQuote}
      </div>
    </div>
  );
};

