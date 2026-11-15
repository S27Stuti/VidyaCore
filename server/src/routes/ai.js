const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const aiService = require('../services/aiService');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');

// Polish Announcement text
router.post('/polish-notice', authenticate, authorize('teacher', 'principal'), async (req, res) => {
  try {
    const { draftText, tone, audience } = req.body;

    if (!draftText || !draftText.trim()) {
      return res.status(400).json({ success: false, message: 'Draft text is required' });
    }

    const polished = await aiService.polishAnnouncement(draftText, tone || 'formal', audience);
    res.json({ success: true, polishedText: polished });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Interactive Academic Assistant Chatbot for Channels & Queries
router.post('/academic-assistant', authenticate, async (req, res) => {
  try {
    const { question, channelName, className } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const answer = await aiService.answerAcademicQuery(question.trim(), { channelName, className });
    res.json({ success: true, answer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Principal AI Campus Summary
router.get('/campus-summary', authenticate, authorize('principal'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' });
    const allAttendance = await Attendance.find();
    const allMarks = await Mark.find();

    const totalStudents = students.length;
    const totalAtt = allAttendance.length;
    const presentAtt = allAttendance.filter((a) => a.status === 'Present').length;
    const lateAtt = allAttendance.filter((a) => a.status === 'Late').length;
    const avgAttendance = totalAtt > 0 ? Math.round(((presentAtt + lateAtt * 0.5) / totalAtt) * 100) : 0;

    // Class wise pass rate
    const classGroups = {};
    allMarks.forEach((m) => {
      const c = m.className || 'General';
      if (!classGroups[c]) classGroups[c] = { total: 0, passed: 0, marksTotal: 0 };
      classGroups[c].total++;
      if (m.marksObtained >= 40) classGroups[c].passed++;
      classGroups[c].marksTotal += m.percentage || m.marksObtained;
    });

    const classStats = Object.keys(classGroups).map((className) => ({
      className,
      passPercentage: Math.round((classGroups[className].passed / classGroups[className].total) * 100),
      avgMarks: Math.round(classGroups[className].marksTotal / classGroups[className].total)
    }));

    // Find at-risk students (< 75% attendance or score < 40)
    // If a student has no attendance or marks recorded by teacher yet, they are awaiting evaluation (not at risk)
    const atRiskStudents = [];
    for (const student of students) {
      const attRecords = allAttendance.filter((a) => a.student.toString() === student._id.toString());
      const studentMarks = allMarks.filter((m) => m.student.toString() === student._id.toString());

      // If teacher has not recorded attendance or marks for this student yet, do not flag
      if (attRecords.length === 0 && studentMarks.length === 0) {
        continue;
      }

      const attPct =
        attRecords.length > 0
          ? Math.round(
              ((attRecords.filter((a) => a.status === 'Present').length +
                attRecords.filter((a) => a.status === 'Late').length * 0.5) /
                attRecords.length) *
                100
            )
          : null;

      const failedSubjects = studentMarks.filter((m) => m.marksObtained < 40).map((m) => m.subject);

      if ((attPct !== null && attPct < 75) || failedSubjects.length > 0) {
        atRiskStudents.push({
          name: student.name,
          rollNo: student.rollNo,
          className: student.className,
          phone: student.phone,
          attendancePct: attPct ?? 0,
          failedSubjects
        });
      }
    }

    const summary = await aiService.generateCampusSummary({
      totalStudents,
      avgAttendance,
      classStats,
      atRiskStudents,
      totalRecords: totalAtt,
      totalMarks: allMarks.length
    });

    res.json({
      success: true,
      summary,
      stats: {
        totalStudents,
        avgAttendance,
        atRiskCount: atRiskStudents.length,
        atRiskStudents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Student AI Performance Coach
router.get('/student-coach/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const attRecords = await Attendance.find({ student: studentId });
    const overallAttendance =
      attRecords.length > 0
        ? Math.round(
            ((attRecords.filter((a) => a.status === 'Present').length +
              attRecords.filter((a) => a.status === 'Late').length * 0.5) /
              attRecords.length) *
              100
          )
        : 0;

    const marksList = await Mark.find({ student: studentId });

    const coachPlan = await aiService.generateStudentCoachPlan({
      studentName: student.name,
      className: student.className,
      overallAttendance,
      marksList
    });

    res.json({
      success: true,
      coachPlan,
      overallAttendance,
      weakSubjects: marksList.filter((m) => m.marksObtained < 60)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

