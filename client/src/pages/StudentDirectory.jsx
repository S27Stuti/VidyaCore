import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Search,
  Filter,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Eye,
  X,
  User,
  GraduationCap
} from 'lucide-react';

export const StudentDirectory = () => {
  const [students, setStudents] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/users/classes');
        setAvailableClasses(res.data.classes || []);
      } catch (err) {
        console.error('Failed to load classes', err);
      }
    };
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/students', {
        params: {
          className: selectedClass,
          search
        }
      });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Failed to fetch student directory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, search]);

  const viewStudentDetails = async (student) => {
    setSelectedStudent(student);
    setModalLoading(true);
    try {
      const [marksRes, attRes] = await Promise.all([
        api.get(`/marks/student/${student._id}`),
        api.get(`/attendance/student/${student._id}`)
      ]);
      setStudentDetails({
        marks: marksRes.data.marks,
        summary: marksRes.data.summary,
        attendance: attRes.data.summary,
        history: attRes.data.history
      });
    } catch (err) {
      console.error('Failed to load student details', err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Institutional Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete student census with real-time academic records, attendance records, and contact channels.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-xs card-hover">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-medium outline-none cursor-pointer"
            >
              <option value="All">All Cohorts</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll, phone..."
              className="pl-8 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none w-52 sm:w-64 card-hover"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white/80 dark:bg-slate-900/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Roll No</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Contact Channel</th>
                <th className="py-3.5 px-4">Attendance Rate</th>
                <th className="py-3.5 px-4">Avg Performance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading Directory...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No students found matching current criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isWarning = student.attendancePercentage < 75;
                  return (
                    <tr
                      key={student._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${student.name}`}
                            alt={student.name}
                            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Roll: {student.rollNo || '—'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          Class {student.className || '—'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{student.phone}</span>
                        </div>
                        {student.parentContact && (
                          <p className="text-[10px] text-slate-400">Parent: {student.parentContact}</p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${isWarning
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                          >
                            {student.attendancePercentage}%
                          </span>
                          {isWarning ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> &lt; 75%
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Good
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {student.averageScore}%
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => viewStudentDetails(student)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-emerald-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors card-hover cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Inspection Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudent.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedStudent.name}`}
                  alt={selectedStudent.name}
                  className="w-12 h-12 rounded-full ring-2 ring-emerald-500/30"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Roll: {selectedStudent.rollNo} • Class: {selectedStudent.className} • Phone: {selectedStudent.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalLoading ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading student transcript...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary badges */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Attendance Rate</p>
                    <p
                      className={`text-lg font-bold mt-0.5 ${selectedStudent.attendancePercentage < 75
                          ? 'text-rose-500'
                          : 'text-emerald-500'
                        }`}
                    >
                      {selectedStudent.attendancePercentage}%
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Overall Grade</p>
                    <p className="text-lg font-bold mt-0.5 text-blue-600 dark:text-emerald-400">
                      {studentDetails?.summary?.overallGrade || 'A'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Scored</p>
                    <p className="text-lg font-bold mt-0.5 text-slate-900 dark:text-white">
                      {studentDetails?.summary?.totalMarksObtained} / {studentDetails?.summary?.totalMaxMarks}
                    </p>
                  </div>
                </div>

                {/* Warning if at risk */}
                {selectedStudent.attendancePercentage < 75 && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Academic Eligibility Warning Flagged</p>
                      <p className="text-[11px] opacity-90">
                        Attendance has fallen below 75%. Student must be issued official warning advisory.
                      </p>
                    </div>
                  </div>
                )}

                {/* Subject-wise Marks Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                    Subject Evaluation Record
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-semibold text-slate-500 uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Exam</th>
                          <th className="py-2.5 px-3">Score</th>
                          <th className="py-2.5 px-3">Grade</th>
                          <th className="py-2.5 px-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {studentDetails?.marks?.map((m) => (
                          <tr key={m._id}>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{m.subject}</td>
                            <td className="py-2.5 px-3 text-slate-500">{m.examType}</td>
                            <td className="py-2.5 px-3 font-bold">{m.marksObtained}/{m.maxMarks} ({m.percentage}%)</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.marksObtained < 40 ? 'bg-rose-500/15 text-rose-600' : 'bg-emerald-500/15 text-emerald-600'
                                }`}>
                                {m.grade}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">{m.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

