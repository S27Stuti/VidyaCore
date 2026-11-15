import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  CheckSquare,
  Award,
  Users,
  Calendar,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Radio,
  Eye,
  Edit3,
  X,
  User,
  Hash,
  School,
  Phone,
  FileText,
  AlertTriangle
} from 'lucide-react';

export const TeacherDashboard = ({ setCurrentTab }) => {
  const { user } = useAuth();
  const { addToast } = useSocket();

  const [activeModule, setActiveModule] = useState('attendance'); // 'attendance' | 'marks'
  const [selectedClass, setSelectedClass] = useState(user?.className || 'All');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [allCampusStudents, setAllCampusStudents] = useState([]);

  // Attendance state
  const [classStudents, setClassStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Marks Entry state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('Midterm');
  const [selectedSubject, setSelectedSubject] = useState(user?.subject || 'Mathematics');
  const [marksObtained, setMarksObtained] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [remarks, setRemarks] = useState('');
  const [savingMarks, setSavingMarks] = useState(false);
  const [recentMarksList, setRecentMarksList] = useState([]);
  const [loadingRecentMarks, setLoadingRecentMarks] = useState(false);

  // Student Detail Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activePortfolioTab, setActivePortfolioTab] = useState('attendance'); // 'attendance' | 'marks'

  // Student Edit Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState({
    id: '',
    name: '',
    rollNo: '',
    className: '',
    phone: '',
    parentContact: '',
    section: ''
  });
  const [savingStudentEdit, setSavingStudentEdit] = useState(false);

  // Direct Student Marks Entry Modal state (Next to Edit button)
  const [marksModalOpen, setMarksModalOpen] = useState(false);
  const [studentForMarks, setStudentForMarks] = useState(null);
  const [modalExamType, setModalExamType] = useState('Midterm');
  const [modalSubject, setModalSubject] = useState('Mathematics');
  const [modalMarksObtained, setModalMarksObtained] = useState('');
  const [modalMaxMarks, setModalMaxMarks] = useState(100);
  const [modalRemarks, setModalRemarks] = useState('');
  const [savingModalMarks, setSavingModalMarks] = useState(false);

  // Load campus-wide students and registered classes from DB
  useEffect(() => {
    const fetchClassesAndStudents = async () => {
      try {
        const [classesRes, studentsRes] = await Promise.all([
          api.get('/users/classes'),
          api.get('/users/students')
        ]);
        const list = classesRes.data.classes || [];
        const students = studentsRes.data.students || [];
        setAvailableClasses(list);
        setAllCampusStudents(students);

        if (list.length > 0) {
          if (user?.className && list.includes(user.className)) {
            setSelectedClass(user.className);
          } else {
            setSelectedClass(list[0]);
          }
        } else {
          setSelectedClass('All');
        }

        if (students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(students[0]._id);
        }
      } catch (err) {
        console.error('Failed to load registered classes or students', err);
      }
    };
    fetchClassesAndStudents();
  }, [user?.className]);

  // Auto-calculated grade
  const calculatedPercentage =
    maxMarks > 0 && marksObtained !== ''
      ? Math.round((Number(marksObtained) / Number(maxMarks)) * 100 * 10) / 10
      : null;

  const calculateGrade = (pct) => {
    if (pct === null || isNaN(pct)) return '—';
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  };

  const currentGrade = calculateGrade(calculatedPercentage);

  // Load class attendance
  const loadClassAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const res = await api.get(`/attendance/class/${selectedClass}`, {
        params: { date: selectedDate }
      });

      setClassStudents(res.data.students || []);

      const recordMap = {};
      (res.data.students || []).forEach((item) => {
        recordMap[item.student._id] = {
          status: item.status || 'Present',
          remarks: item.remarks || ''
        };
      });
      setAttendanceRecords(recordMap);

      if (res.data.students?.length > 0) {
        if (!selectedStudentId || !res.data.students.some((s) => s.student._id === selectedStudentId)) {
          setSelectedStudentId(res.data.students[0].student._id);
        }
      } else if (allCampusStudents.length > 0) {
        if (!selectedStudentId) {
          setSelectedStudentId(allCampusStudents[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load class attendance', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    loadClassAttendance();
  }, [selectedClass, selectedDate]);

  // Fast "Mark All Present" toggle
  const markAllPresent = () => {
    const updated = { ...attendanceRecords };
    classStudents.forEach((item) => {
      updated[item.student._id] = {
        ...(updated[item.student._id] || {}),
        status: 'Present'
      };
    });
    setAttendanceRecords(updated);
    addToast('Marked All Present', `Set all ${classStudents.length} students to Present`, 'attendance');
  };

  // Toggle single student status
  const setStudentStatus = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status
      }
    }));
  };

  // Save attendance batch
  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const records = Object.keys(attendanceRecords).map((sId) => ({
        studentId: sId,
        status: attendanceRecords[sId].status,
        remarks: attendanceRecords[sId].remarks || ''
      }));

      await api.post('/attendance/mark', {
        className: selectedClass,
        date: selectedDate,
        records
      });

      addToast(
        'Attendance Dispatched',
        `Attendance for Class ${selectedClass} successfully saved & notifications sent.`,
        'attendance'
      );
    } catch (err) {
      console.error('Failed to save attendance', err);
      addToast('Error Saving Attendance', err.response?.data?.message || 'Failed to save', 'warning');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Save marks
  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || marksObtained === '') {
      addToast('Missing Info', 'Please select a student and enter marks.', 'warning');
      return;
    }

    setSavingMarks(true);
    try {
      const activeStudent =
        classStudents.find((s) => s.student._id === selectedStudentId)?.student ||
        allCampusStudents.find((s) => s._id === selectedStudentId);

      const res = await api.post('/marks/save', {
        studentId: selectedStudentId,
        className: activeStudent?.className || selectedClass,
        examType: selectedExamType,
        subject: selectedSubject,
        marksObtained: Number(marksObtained),
        maxMarks: Number(maxMarks),
        remarks
      });

      addToast(
        'Marks Recorded & Notified',
        `${selectedSubject}: Scored ${marksObtained}/${maxMarks} (Grade ${res.data.mark.grade}). Student has been notified.`,
        'marks'
      );

      setMarksObtained('');
      setRemarks('');
      loadRecentMarks();
    } catch (err) {
      console.error('Failed to save marks', err);
      addToast('Error', err.response?.data?.message || 'Failed to save marks', 'warning');
    } finally {
      setSavingMarks(false);
    }
  };

  // Load recent marks recorded for the active class
  const loadRecentMarks = async () => {
    setLoadingRecentMarks(true);
    try {
      const res = await api.get(`/marks/class/${selectedClass}`);
      setRecentMarksList(res.data.marks || []);
    } catch (err) {
      console.error('Failed to load recent marks', err);
    } finally {
      setLoadingRecentMarks(false);
    }
  };

  useEffect(() => {
    if (activeModule === 'marks') {
      loadRecentMarks();
    }
  }, [selectedClass, activeModule]);

  // Open Student Full History / Portfolio Modal
  const openStudentDetail = async (student) => {
    setSelectedStudentForDetail(student);
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.get(`/users/student/${student._id}/portfolio`);
      setPortfolioData(res.data);
    } catch (err) {
      console.error('Failed to load student portfolio', err);
      addToast('Error', 'Could not load student detailed record', 'warning');
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Edit Student Modal
  const openEditStudent = (student) => {
    setEditingStudent({
      id: student._id,
      name: student.name || '',
      rollNo: student.rollNo || '',
      className: student.className || '',
      phone: student.phone || '',
      parentContact: student.parentContact || '',
      section: student.section || ''
    });
    setEditModalOpen(true);
  };

  // Save Student Profile Edits
  const handleSaveStudentEdit = async (e) => {
    e.preventDefault();
    setSavingStudentEdit(true);
    try {
      await api.put(`/users/student/${editingStudent.id}`, editingStudent);
      addToast('Student Updated', `${editingStudent.name}'s profile details updated successfully`, 'attendance');
      setEditModalOpen(false);
      loadClassAttendance();
    } catch (err) {
      console.error('Failed to update student details', err);
      addToast('Update Failed', err.response?.data?.message || 'Failed to save student details', 'warning');
    } finally {
      setSavingStudentEdit(false);
    }
  };

  // Open Direct Add Marks Modal for specific student
  const openAddMarksModal = (student) => {
    setStudentForMarks(student);
    setModalExamType('Midterm');
    setModalSubject(user?.subject || 'Mathematics');
    setModalMarksObtained('');
    setModalMaxMarks(100);
    setModalRemarks('');
    setMarksModalOpen(true);
  };

  // Auto-calculated modal percentage and grade preview
  const modalPercentage =
    modalMaxMarks > 0 && modalMarksObtained !== ''
      ? Math.round((Number(modalMarksObtained) / Number(modalMaxMarks)) * 100 * 10) / 10
      : null;
  const modalGrade = calculateGrade(modalPercentage);

  // Save Marks from Direct Student Modal
  const handleSaveModalMarks = async (e) => {
    e.preventDefault();
    if (!studentForMarks?._id || modalMarksObtained === '') {
      addToast('Missing Info', 'Please enter marks obtained for the student.', 'warning');
      return;
    }

    setSavingModalMarks(true);
    try {
      const res = await api.post('/marks/save', {
        studentId: studentForMarks._id,
        className: studentForMarks.className || selectedClass,
        examType: modalExamType,
        subject: modalSubject,
        marksObtained: Number(modalMarksObtained),
        maxMarks: Number(modalMaxMarks),
        remarks: modalRemarks
      });

      addToast(
        'Marks Recorded & Broadcasted 🚀',
        `${studentForMarks.name}: Scored ${modalMarksObtained}/${modalMaxMarks} in ${modalSubject} (${res.data.mark.percentage}%, Grade ${res.data.mark.grade}). Student & Principal have been notified.`,
        'marks'
      );

      setMarksModalOpen(false);
      loadClassAttendance();
      loadRecentMarks();
    } catch (err) {
      console.error('Failed to save marks from student modal', err);
      addToast('Error', err.response?.data?.message || 'Failed to save marks', 'warning');
    } finally {
      setSavingModalMarks(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Teacher Instruction Hub
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-emerald-400 border border-blue-500/20">
              Class & Subject Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fast daily attendance marking, automatic grade computation, and instant student notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentTab('channels')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-sm transition-all card-hover"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Broadcast Announcements</span>
          </button>
        </div>
      </div>

      {/* Module Selector Tabs - Responsive Segmented Pill Bar */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-xs max-w-full">
        <button
          type="button"
          onClick={() => setActiveModule('attendance')}
          className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 select-none cursor-pointer w-full sm:w-auto ${activeModule === 'attendance'
              ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20'
              : 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/70'
            }`}
        >
          <CheckSquare className="w-4 h-4 shrink-0" />
          <span className="truncate sm:whitespace-nowrap">Mark Daily Attendance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModule('marks')}
          className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 select-none cursor-pointer w-full sm:w-auto ${activeModule === 'marks'
              ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-white/20'
              : 'bg-slate-100/90 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/70'
            }`}
        >
          <Award className="w-4 h-4 shrink-0 text-amber-500" />
          <span className="truncate sm:whitespace-nowrap">Marks &amp; Automatic Grading</span>
        </button>
      </div>

      {/* MODULE 1: FAST ATTENDANCE MARKING */}
      {activeModule === 'attendance' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 rounded-2xl glass-card bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            {/* Top: Class Selector 1 to 12 Pills */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Select Class Cohort (Classes 1 to 12)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClass('All')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedClass.toLowerCase() === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All Classes
                </button>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedClass.toLowerCase() === cls.toLowerCase()
                        ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Class {cls}
                  </button>
                ))}
                {availableClasses
                  .filter((c) => !['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].includes(c))
                  .map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedClass(cls)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedClass.toLowerCase() === cls.toLowerCase()
                          ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      Class {cls}
                    </button>
                  ))}
              </div>
            </div>

            {/* Bottom Row: Inputs + Fast Actions */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-3.5 border-t border-slate-200/70 dark:border-slate-800/80">
              <div className="flex flex-wrap items-center gap-3">
                {/* Custom Class Input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Or Custom Class
                  </label>
                  <input
                    type="text"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    placeholder="e.g. 10-A, CSE-1"
                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none w-32 focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Session Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-none cursor-pointer shadow-2xs"
                  />
                </div>
              </div>

              {/* Fast Actions Buttons (Single-line, matching heights, crisp alignment) */}
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 pt-1 sm:pt-0">
                <button
                  type="button"
                  onClick={markAllPresent}
                  className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/35 hover:border-emerald-500/60 transition-all active:scale-95 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs hover:shadow-sm"
                  title="Quickly set all students in this cohort to Present"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="whitespace-nowrap">Mark All Present</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={savingAttendance}
                  className="flex items-center justify-center gap-2 h-10 px-4.5 sm:px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                  title="Save attendance and broadcast real-time notifications"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    {savingAttendance ? 'Broadcasting...' : 'Save & Notify Class'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Student Attendance List */}
          <div className="glass-panel rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            {/* Mobile Touch Cards View (md:hidden) */}
            <div className="md:hidden p-3 space-y-3">
              {attendanceLoading ? (
                <div className="py-10 text-center text-slate-400 flex justify-center items-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Loading Student Roster...</span>
                </div>
              ) : classStudents.length === 0 ? (
                <div className="py-8 text-center text-slate-500 space-y-3">
                  <p className="text-xs font-semibold">No students enrolled in Class "{selectedClass}".</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedClass('1')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 shadow-xs cursor-pointer"
                    >
                      👉 View Class 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedClass('All')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      All Classes
                    </button>
                  </div>
                </div>
              ) : (
                classStudents.map(({ student }) => {
                  const currentStatus = attendanceRecords[student._id]?.status || 'Present';
                  return (
                    <div
                      key={student._id}
                      className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/80 border-2 border-slate-200/80 dark:border-slate-700 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${student.name}`}
                            alt={student.name}
                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border-2 border-emerald-500/30"
                          />
                          <div>
                            <p className="font-bold text-xs text-slate-900 dark:text-white">{student.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              Roll #{student.rollNo || '1'} • Class {student.className}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => openStudentDetail(student)}
                            className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-slate-600 text-[10px] font-bold cursor-pointer"
                          >
                            Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditStudent(student)}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-[10px] font-bold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openAddMarksModal(student)}
                            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-[10px] font-bold shadow-xs cursor-pointer flex items-center gap-1 active:scale-95 whitespace-nowrap"
                            title="Add subject marks for this student"
                          >
                            <Award className="w-3 h-3" />
                            <span>+ Marks</span>
                          </button>
                        </div>
                      </div>

                      {/* 3 Large Touch Buttons for Status on Mobile */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setStudentStatus(student._id, 'Present')}
                          className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            currentStatus === 'Present'
                              ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/30'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Present</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentStatus(student._id, 'Absent')}
                          className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            currentStatus === 'Absent'
                              ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-500/30'
                              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Absent</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentStatus(student._id, 'Late')}
                          className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            currentStatus === 'Late'
                              ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Late</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Roll No</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-center">Daily Status (Present / Absent / Late)</th>
                    <th className="py-3 px-4 text-center">Actions & Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {attendanceLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="flex justify-center items-center gap-2">
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          <span>Loading Registered Student Roster...</span>
                        </div>
                      </td>
                    </tr>
                  ) : classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                          No students enrolled in Class "{selectedClass}".
                        </p>
                        <p className="text-xs text-slate-500 mt-1 mb-3">
                          You can switch to Class 1 or view All Classes to mark attendance.
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedClass('1')}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 shadow-xs cursor-pointer"
                          >
                            👉 View Class 1
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedClass('All')}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
                          >
                            All Classes
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    classStudents.map(({ student }) => {
                      const currentStatus = attendanceRecords[student._id]?.status || 'Present';
                      return (
                        <tr
                          key={student._id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={student.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${student.name}`}
                                alt={student.name}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800"
                              />
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {student.name}
                                </p>
                                <p className="text-[11px] text-slate-400">{student.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-medium">
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
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{student.phone || '—'}</p>
                              {student.parentContact && (
                                <p className="text-[10px] text-slate-400">Parent: {student.parentContact}</p>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Present */}
                              <button
                                onClick={() => setStudentStatus(student._id, 'Present')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${currentStatus === 'Present'
                                    ? 'bg-emerald-500 text-white shadow-xs scale-105'
                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                                  }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Present</span>
                              </button>

                              {/* Absent */}
                              <button
                                onClick={() => setStudentStatus(student._id, 'Absent')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${currentStatus === 'Absent'
                                    ? 'bg-rose-500 text-white shadow-xs scale-105'
                                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
                                  }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Absent</span>
                              </button>

                              {/* Late */}
                              <button
                                onClick={() => setStudentStatus(student._id, 'Late')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${currentStatus === 'Late'
                                    ? 'bg-amber-500 text-white shadow-xs scale-105'
                                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                                  }`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Late</span>
                              </button>
                            </div>
                          </td>

                          {/* ACTIONS COLUMN: DETAIL, EDIT & MARKS BUTTONS */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Detail Button */}
                              <button
                                type="button"
                                onClick={() => openStudentDetail(student)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-all card-hover cursor-pointer"
                                title="View student records and entered marks"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detail</span>
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                onClick={() => openEditStudent(student)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all card-hover cursor-pointer"
                                title="Edit student profile details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {/* DIRECT ADD MARKS BUTTON NEXT TO EDIT */}
                              <button
                                type="button"
                                onClick={() => openAddMarksModal(student)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                title="Add or update subject marks for this student"
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Add Marks</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: MARKS & AUTOMATIC GRADING */}
      {activeModule === 'marks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Marks Entry Form */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
            <div className="pb-4 mb-4 border-b border-slate-200/80 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Enter Subject Marks with Real-Time Grade Calculation
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Grades and percentages are calculated on-the-fly and instantly dispatched to the student's portal.
              </p>
            </div>

            <form onSubmit={handleSaveMarks} className="space-y-4">
              {/* Class Selection & Quick Pills */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Class Cohort (Classes 1 to 12)
                  </label>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-emerald-400">
                    Active: Class {selectedClass}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  {['All', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setSelectedClass(cls)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedClass.toLowerCase() === cls.toLowerCase()
                          ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-xs scale-105'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                    >
                      {cls === 'All' ? 'All' : `Class ${cls}`}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  placeholder="Or enter custom class/section (e.g. 10-A, 12-B)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all font-medium"
                />
              </div>

              {/* Student Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>Select Enrolled Student to Grade</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {classStudents.length} in Class {selectedClass} • {allCampusStudents.length} Campus Total
                  </span>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all font-semibold cursor-pointer"
                >
                  {classStudents.length > 0 && (
                    <optgroup label={`Students in Selected Class (${selectedClass})`}>
                      {classStudents.map(({ student }) => (
                        <option key={student._id} value={student._id}>
                          {student.name} — Roll: {student.rollNo || '1'} (Class: {student.className})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <optgroup label="All Enrolled Students Across Campus">
                    {allCampusStudents
                      .filter((s) => !classStudents.some((cs) => cs.student._id === s._id))
                      .map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.name} — Roll: {student.rollNo || '1'} (Class: {student.className || '1'})
                        </option>
                      ))}
                  </optgroup>
                </select>

                {/* Enhanced Institutional Student Identity Card */}
                {(() => {
                  const sel =
                    classStudents.find((s) => s.student._id === selectedStudentId)?.student ||
                    allCampusStudents.find((s) => s._id === selectedStudentId);
                  if (!sel) return null;
                  return (
                    <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border-2 border-emerald-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={sel.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${sel.name}`}
                          alt={sel.name}
                          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-emerald-500/40 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{sel.name}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white font-mono">
                              Roll #{sel.rollNo || '1'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white">
                              Class {sel.className || '1'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                            <span>{sel.email}</span>
                            {sel.phone && <span>• Tel: {sel.phone}</span>}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Verified Enrolled
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Exam Category and Evaluation Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Examination Category
                  </label>
                  <select
                    value={selectedExamType}
                    onChange={(e) => setSelectedExamType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all font-semibold cursor-pointer"
                  >
                    <option value="Midterm">Midterm Examination</option>
                    <option value="Final Exam">Final Examination</option>
                    <option value="Unit Test 1">Unit Test 1</option>
                    <option value="Unit Test 2">Unit Test 2</option>
                    <option value="Quarterly">Quarterly Assessment</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Evaluation Subject
                    </label>
                    <div className="flex items-center gap-1">
                      {['Math', 'Science', 'English'].map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setSelectedSubject(sub === 'Math' ? 'Mathematics' : sub)}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-emerald-400 hover:bg-blue-50 cursor-pointer"
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    placeholder="e.g. Mathematics, Science"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Marks Obtained & Maximum Marks */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Marks Obtained *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={maxMarks}
                    required
                    value={marksObtained}
                    onChange={(e) => setMarksObtained(e.target.value)}
                    placeholder="e.g. 85"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all font-black text-blue-600 dark:text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    Maximum Marks *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    placeholder="100"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all font-black"
                  />
                </div>
              </div>

              {/* Teacher Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Teacher Remarks / Qualitative Evaluation
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Strong conceptual grasp, excellent problem solving."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all font-medium"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={savingMarks}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 card-hover cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingMarks ? 'Recording Score...' : 'Commit Marks & Alert Student'}</span>
              </button>
            </form>
          </div>

          {/* Automatic Grade & Calculation Preview Card */}
          <div className="glass-panel rounded-2xl p-6 border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-200/80 dark:border-slate-800">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Real-Time Calculation Engine
                </h3>
              </div>

              <div className="space-y-4">
                {/* Live Computed Percentage */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-white to-emerald-50/70 dark:from-slate-800/90 dark:via-slate-800/50 dark:to-slate-900 border-2 border-blue-200/90 dark:border-slate-700 text-center shadow-xs">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Computed Percentage
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-emerald-400 mt-1">
                    {calculatedPercentage !== null ? `${calculatedPercentage}%` : '—'}
                  </p>
                  {/* Live Animated Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 transition-all duration-300"
                      style={{
                        width: calculatedPercentage !== null ? `${Math.min(100, Math.max(0, calculatedPercentage))}%` : '0%'
                      }}
                    />
                  </div>
                </div>

                {/* Assigned Letter Grade */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-white to-blue-50/70 dark:from-slate-800/90 dark:via-slate-800/50 dark:to-slate-900 border-2 border-emerald-200/90 dark:border-slate-700 text-center shadow-xs">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Assigned Letter Grade
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span
                      className={`px-5 py-1.5 rounded-xl text-2xl font-black ${currentGrade === 'A+' || currentGrade === 'A'
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 shadow-xs'
                          : currentGrade === 'B+' || currentGrade === 'B'
                            ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/40 shadow-xs'
                            : currentGrade === 'C' || currentGrade === 'D'
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 shadow-xs'
                              : currentGrade === 'F'
                                ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/40 shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                        }`}
                    >
                      {currentGrade}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold mt-2 text-slate-700 dark:text-slate-200">
                    {currentGrade === 'A+' && 'Outstanding Distinction'}
                    {currentGrade === 'A' && 'Excellent Mastery'}
                    {currentGrade === 'B+' && 'Very Good Standard'}
                    {currentGrade === 'B' && 'Good Standing'}
                    {currentGrade === 'C' && 'Satisfactory Pass'}
                    {currentGrade === 'D' && 'Marginal Pass'}
                    {currentGrade === 'F' && 'Remedial Action Required'}
                    {currentGrade === '—' && 'Awaiting Marks Input'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 shadow-2xs">
                  <p className="font-bold text-blue-700 dark:text-emerald-300">VidyaCore Grading Benchmark:</p>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />90%+ : A+ (Distinction)</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" />80%–89% : A (Excellent)</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />70%–79% : B+ (Very Good)</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />60%–69% : B (Good)</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />40%–59% : C/D (Pass)</span>
                    <span className="flex items-center gap-1 text-rose-600 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />&lt;40% : F (Remedial)</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-4">
              Saving triggers immediate in-app toast alerts for the student.
            </p>
          </div>

          {/* RECENT MARKS RECORDED FOR THIS CLASS */}
          <div className="lg:col-span-3 glass-panel rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 card-hover shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Marks Records Evaluated for Class {selectedClass}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live ledger showing all subjects, grades, and scores you have recorded for each student
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-emerald-400 border border-blue-500/20">
                {recentMarksList.length} Recorded Exams
              </span>
            </div>

            {loadingRecentMarks ? (
              <div className="py-10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading evaluated scores...</span>
              </div>
            ) : recentMarksList.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No examination marks recorded yet for Class "{selectedClass}". Use the form above to evaluate a student.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Roll No</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Exam Category</th>
                      <th className="py-2.5 px-3 text-center">Score / Max</th>
                      <th className="py-2.5 px-3 text-center">Percentage</th>
                      <th className="py-2.5 px-3 text-center">Grade</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                    {recentMarksList.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {m.student?.name || 'Student'}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {m.student?.rollNo || '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Class {m.className || selectedClass}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {m.subject}
                        </td>
                        <td className="py-3 px-3 text-slate-500">{m.examType}</td>
                        <td className="py-3 px-3 text-center font-bold">
                          {m.marksObtained} / {m.maxMarks}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {m.percentage || Math.round((m.marksObtained / m.maxMarks) * 100)}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {m.grade}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px] truncate max-w-xs">
                          {m.remarks || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: STUDENT DETAIL MODAL (Complete Academic Portfolio & Entered Data) */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[90dvh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={selectedStudentForDetail?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedStudentForDetail?.name}`}
                  alt={selectedStudentForDetail?.name}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedStudentForDetail?.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
                      Roll: {selectedStudentForDetail?.rollNo || '—'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Class {selectedStudentForDetail?.className || '—'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedStudentForDetail?.email} • Phone: {selectedStudentForDetail?.phone || '—'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {detailLoading ? (
              <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Aggregating Student Portfolio...</span>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-4 pr-1 flex-1">
                {/* Stats Summary Cards with Overall Percentage & Grade */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Overall Percentage & Grade */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/20 text-center shadow-xs">
                    <p className="text-[10px] uppercase font-black tracking-wider text-blue-600 dark:text-blue-400">
                      Overall Percentage
                    </p>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-0.5">
                      {portfolioData?.marks?.overallPercentage ?? 0}%
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      Grade: <span className="font-black text-emerald-600 dark:text-emerald-400">{portfolioData?.marks?.overallGrade || '—'}</span>
                    </p>
                  </div>

                  {/* Total Marks */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 text-center shadow-xs">
                    <p className="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400">
                      Total Marks
                    </p>
                    <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5 font-mono">
                      {portfolioData?.marks?.totalMarksObtained || 0} <span className="text-xs font-normal text-slate-500">/ {portfolioData?.marks?.totalMaxMarks || 0}</span>
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {portfolioData?.marks?.records?.length || 0} Subjects Graded
                    </p>
                  </div>

                  {/* Attendance Rate */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center shadow-xs">
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400">
                      Attendance Rate
                    </p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                      {portfolioData?.attendance?.attendancePct ?? 0}%
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {portfolioData?.attendance?.presentCount ?? 0} Present / {portfolioData?.attendance?.absentCount ?? 0} Absent
                    </p>
                  </div>

                  {/* Add Marks Shortcut */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600/5 to-emerald-600/10 border border-blue-500/20 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Quick Action
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const studentToGrade = selectedStudentForDetail;
                        setDetailModalOpen(false);
                        openAddMarksModal(studentToGrade);
                      }}
                      className="w-full py-1.5 px-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-xs cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>+ Add Marks</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs: Attendance History vs Evaluated Marks */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setActivePortfolioTab('attendance')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activePortfolioTab === 'attendance'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    Attendance Records ({portfolioData?.attendance?.records?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePortfolioTab('marks')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activePortfolioTab === 'marks'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    Evaluated Marks ({portfolioData?.marks?.records?.length || 0})
                  </button>
                </div>

                {/* TAB 1: ATTENDANCE RECORDS */}
                {activePortfolioTab === 'attendance' && (
                  <div>
                    {(!portfolioData?.attendance?.records || portfolioData.attendance.records.length === 0) ? (
                      <p className="py-8 text-center text-xs text-slate-400">No attendance days recorded for this student yet.</p>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-semibold text-slate-500 uppercase">
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3">Marked By</th>
                              <th className="py-2 px-3">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {portfolioData.attendance.records.map((att) => (
                              <tr key={att._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="py-2 px-3 font-mono font-medium">
                                  {new Date(att.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${att.status === 'Present'
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                        : att.status === 'Absent'
                                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                      }`}
                                  >
                                    {att.status}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-500">{att.markedBy?.name || 'Class Faculty'}</td>
                                <td className="py-2 px-3 text-slate-400 text-[11px]">{att.remarks || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: MARKS & EVALUATIONS */}
                {activePortfolioTab === 'marks' && (
                  <div>
                    {(!portfolioData?.marks?.records || portfolioData.marks.records.length === 0) ? (
                      <p className="py-8 text-center text-xs text-slate-400">No examination scores recorded for this student yet.</p>
                    ) : (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-semibold text-slate-500 uppercase">
                              <th className="py-2 px-3">Subject</th>
                              <th className="py-2 px-3">Exam Type</th>
                              <th className="py-2 px-3 text-center">Score</th>
                              <th className="py-2 px-3 text-center">Grade</th>
                              <th className="py-2 px-3">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {portfolioData.marks.records.map((m) => (
                              <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{m.subject}</td>
                                <td className="py-2.5 px-3 text-slate-500">{m.examType}</td>
                                <td className="py-2.5 px-3 text-center font-bold">
                                  {m.marksObtained}/{m.maxMarks} ({m.percentage || Math.round((m.marksObtained / m.maxMarks) * 100)}%)
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    {m.grade}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-xs">{m.remarks || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  const studentToGrade = selectedStudentForDetail;
                  setDetailModalOpen(false);
                  openAddMarksModal(studentToGrade);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Add / Update Marks for {selectedStudentForDetail?.name?.split(' ')[0]}</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STUDENT DETAILS MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Edit Student Profile
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update student roll number, class assignment, or contact numbers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Roll Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.rollNo}
                    onChange={(e) => setEditingStudent({ ...editingStudent, rollNo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Class Cohort (1 to 12) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.className}
                    onChange={(e) => setEditingStudent({ ...editingStudent, className: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Phone Number
                  </label>
                  <input
                    type="text"
                    value={editingStudent.phone}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                    placeholder="+91 98000 00000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parent Contact Number
                  </label>
                  <input
                    type="text"
                    value={editingStudent.parentContact}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentContact: e.target.value })}
                    placeholder="+91 98000 99999"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStudentEdit}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingStudentEdit ? 'Updating...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DIRECT ADD SUBJECT MARKS MODAL */}
      {marksModalOpen && studentForMarks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-3.5 sm:space-y-4 max-h-[90dvh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center shadow-md">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Add Subject Marks & Grade
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter examination score for <span className="font-bold text-blue-600 dark:text-emerald-400">{studentForMarks.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMarksModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Preview Card */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src={studentForMarks.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${studentForMarks.name}`}
                  alt={studentForMarks.name}
                  className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700"
                />
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{studentForMarks.name}</p>
                  <p className="text-[11px] text-slate-500">{studentForMarks.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Roll: {studentForMarks.rollNo || '1'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Class {studentForMarks.className || selectedClass}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModalMarks} className="space-y-3.5 text-xs overflow-y-auto pr-1 flex-1">
              {/* Exam Category */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Examination Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={modalExamType}
                  onChange={(e) => setModalExamType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Midterm">Midterm Examination</option>
                  <option value="Final Exam">Final Examination / Annual Exam</option>
                  <option value="Unit Test 1">Unit Test 1</option>
                  <option value="Unit Test 2">Unit Test 2</option>
                  <option value="Quarterly Exam">Quarterly Examination</option>
                  <option value="Practical / Viva">Practical / Viva Voce</option>
                  <option value="Monthly Assessment">Monthly Assessment</option>
                </select>
              </div>

              {/* Subject Selection / Input */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Evaluation Subject <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    value={modalSubject}
                    onChange={(e) => setModalSubject(e.target.value)}
                    placeholder="e.g. Mathematics, Science, English, Computer Science..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  {/* Quick Subject Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {['Mathematics', 'Science', 'English', 'Social Science', 'Hindi', 'Physics', 'Chemistry', 'Biology', 'Computer Science'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setModalSubject(sub)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                          modalSubject === sub
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Marks Obtained & Max Marks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Marks Obtained <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={modalMaxMarks}
                    step="0.5"
                    required
                    value={modalMarksObtained}
                    onChange={(e) => setModalMarksObtained(e.target.value)}
                    placeholder="e.g. 88"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum Marks <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={modalMaxMarks}
                    onChange={(e) => setModalMaxMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Real-Time Live Calculation Engine Preview */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800/80 border border-blue-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Live Score Computed
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {modalPercentage !== null ? `${modalPercentage}%` : '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    Auto Grade
                  </p>
                  <span
                    className={`inline-block mt-0.5 px-3 py-0.5 rounded-lg text-sm font-black ${
                      modalGrade === 'A+' || modalGrade === 'A'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : modalGrade === 'B+' || modalGrade === 'B'
                        ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                        : modalGrade === 'C' || modalGrade === 'D'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                        : modalGrade === 'F'
                        ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {modalGrade}
                  </span>
                </div>
              </div>

              {/* Qualitative Remarks */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teacher Remarks / Feedback
                </label>
                <textarea
                  rows="2"
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  placeholder="e.g. Strong conceptual grasp, excellent problem solving."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-xs resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setMarksModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingModalMarks}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{savingModalMarks ? 'Saving & Notifying...' : 'Save & Broadcast Marks'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

