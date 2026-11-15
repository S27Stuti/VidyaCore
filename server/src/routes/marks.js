const express = require('express');
const router = express.Router();
const Mark = require('../models/Mark');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { emitToUser, emitBroadcast } = require('../socket');

// Add or update marks for a student
router.post('/save', authenticate, authorize('teacher', 'principal'), async (req, res) => {
  try {
    const { studentId, className, examType, subject, marksObtained, maxMarks, remarks } = req.body;

    if (!studentId || !subject || marksObtained === undefined) {
      return res.status(400).json({ success: false, message: 'Student, subject, and marks are required' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const max = Number(maxMarks) || 100;
    const obtained = Number(marksObtained);
    const percentage = Math.round((obtained / max) * 100 * 10) / 10;

    let grade = 'B';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';
    else grade = 'F';

    const mark = await Mark.findOneAndUpdate(
      {
        student: studentId,
        examType: examType || 'Midterm',
        subject
      },
      {
        student: studentId,
        className: (!className || className.toLowerCase() === 'all') ? student.className : className,
        examType: examType || 'Midterm',
        subject,
        marksObtained: obtained,
        maxMarks: max,
        percentage,
        grade,
        remarks: remarks || '',
        teacher: req.user._id
      },
      { upsert: true, returnDocument: 'after' }
    );

    // Notify student
    const notif = await Notification.create({
      recipient: studentId,
      title: 'New Marks Entered',
      message: `${subject} (${examType || 'Midterm'}): You scored ${obtained}/${max} (${percentage}%, Grade ${grade}).`,
      type: 'marks',
      link: '/student/dashboard'
    });

    emitToUser(studentId, 'new_notification', {
      notification: notif,
      mark
    });

    emitBroadcast('marks_updated', {
      studentId,
      className: student.className,
      subject
    });

    res.json({
      success: true,
      message: 'Marks updated successfully',
      mark
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all marks for a student (report card summary)
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const marks = await Mark.find({ student: studentId }).sort({ subject: 1 });

    const totalMarksObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
    const totalMaxMarks = marks.reduce((sum, m) => sum + m.maxMarks, 0);
    const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100 * 10) / 10 : 0;

    let overallGrade = '—';
    if (marks.length > 0) {
      if (overallPercentage >= 90) overallGrade = 'A+';
      else if (overallPercentage >= 80) overallGrade = 'A';
      else if (overallPercentage >= 70) overallGrade = 'B+';
      else if (overallPercentage >= 60) overallGrade = 'B';
      else if (overallPercentage >= 50) overallGrade = 'C';
      else if (overallPercentage >= 40) overallGrade = 'D';
      else overallGrade = 'F';
    }

    res.json({
      success: true,
      student,
      summary: {
        totalSubjects: marks.length,
        totalMarksObtained,
        totalMaxMarks,
        overallPercentage,
        overallGrade,
        passed: marks.length > 0 ? (overallPercentage >= 40 && !marks.some((m) => m.grade === 'F')) : null
      },
      marks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get marks by class and exam
router.get('/class/:className', authenticate, async (req, res) => {
  try {
    const { className } = req.params;
    const { examType } = req.query;

    const filter = { className };
    if (examType) filter.examType = examType;

    const marks = await Mark.find(filter).populate('student', 'name rollNo email phone');
    res.json({ success: true, marks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Analytics: Overall school pass percentage, class-wise result comparison, subject-wise distribution
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const allMarks = await Mark.find().populate('student', 'className name');

    // Group marks by student to get overall student pass/fail status
    const studentPerformance = {};
    allMarks.forEach((m) => {
      const sId = m.student?._id?.toString() || m.student?.toString();
      if (!sId) return;

      if (!studentPerformance[sId]) {
        studentPerformance[sId] = {
          studentId: sId,
          className: m.className || m.student?.className || 'General',
          totalObtained: 0,
          totalMax: 0,
          hasFailedSubject: false
        };
      }
      studentPerformance[sId].totalObtained += m.marksObtained;
      studentPerformance[sId].totalMax += m.maxMarks;
      if (m.marksObtained < 40) {
        studentPerformance[sId].hasFailedSubject = true;
      }
    });

    const students = Object.values(studentPerformance);
    const totalStudentsEvaluated = students.length;
    const passedStudents = students.filter((s) => s.totalMax > 0 && s.totalObtained / s.totalMax >= 0.4 && !s.hasFailedSubject);
    const overallPassPercentage = totalStudentsEvaluated > 0 ? Math.round((passedStudents.length / totalStudentsEvaluated) * 100) : 0;

    // Class-wise comparison
    const classGroups = {};
    students.forEach((s) => {
      if (!classGroups[s.className]) {
        classGroups[s.className] = { total: 0, passed: 0, marksTotal: 0, maxTotal: 0 };
      }
      classGroups[s.className].total++;
      if (s.totalMax > 0 && s.totalObtained / s.totalMax >= 0.4 && !s.hasFailedSubject) {
        classGroups[s.className].passed++;
      }
      classGroups[s.className].marksTotal += s.totalObtained;
      classGroups[s.className].maxTotal += s.totalMax;
    });

    const classWiseResults = Object.keys(classGroups).map((cName) => {
      const g = classGroups[cName];
      const passPct = g.total > 0 ? Math.round((g.passed / g.total) * 100) : 0;
      const avgMarks = g.maxTotal > 0 ? Math.round((g.marksTotal / g.maxTotal) * 100) : 0;
      return {
        className: cName,
        passPercentage: passPct,
        avgMarks,
        totalStudents: g.total,
        passedStudents: g.passed
      };
    });

    // Subject-wise marks distribution
    const subjectMap = {};
    allMarks.forEach((m) => {
      if (!subjectMap[m.subject]) {
        subjectMap[m.subject] = { totalScores: 0, count: 0, highest: 0, lowest: 100 };
      }
      subjectMap[m.subject].totalScores += m.percentage || m.marksObtained;
      subjectMap[m.subject].count++;
      if (m.marksObtained > subjectMap[m.subject].highest) subjectMap[m.subject].highest = m.marksObtained;
      if (m.marksObtained < subjectMap[m.subject].lowest) subjectMap[m.subject].lowest = m.marksObtained;
    });

    const subjectDistribution = Object.keys(subjectMap).map((sub) => ({
      subject: sub,
      averageMarks: Math.round(subjectMap[sub].totalScores / subjectMap[sub].count),
      highest: subjectMap[sub].highest,
      lowest: subjectMap[sub].lowest === 100 && subjectMap[sub].count === 0 ? 0 : subjectMap[sub].lowest
    }));

    res.json({
      success: true,
      overallPassPercentage,
      totalStudentsEvaluated,
      classWiseResults,
      subjectDistribution
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

