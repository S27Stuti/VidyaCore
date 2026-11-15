const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { emitToUser, emitBroadcast } = require('../socket');

// Mark attendance (Single or Batch for a class)
router.post('/mark', authenticate, authorize('teacher', 'principal'), async (req, res) => {
  try {
    const { className, date, records } = req.body;
    // records: [ { studentId, status: 'Present'|'Absent'|'Late', remarks } ]

    if (!className || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Class name, date, and student records are required' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const savedRecords = [];

    for (const item of records) {
      // Determine student's actual class if className is 'All' or generic
      let studentClass = className;
      if (!studentClass || studentClass.toLowerCase() === 'all') {
        const studentObj = await User.findById(item.studentId).select('className');
        if (studentObj?.className) studentClass = studentObj.className;
      }

      const updated = await Attendance.findOneAndUpdate(
        { student: item.studentId, date: attendanceDate },
        {
          student: item.studentId,
          className: studentClass,
          date: attendanceDate,
          status: item.status || 'Present',
          markedBy: req.user._id,
          remarks: item.remarks || ''
        },
        { upsert: true, returnDocument: 'after' }
      );

      savedRecords.push(updated);

      // Create in-app notification for the student
      const notifMessage = `Your attendance for ${attendanceDate.toLocaleDateString()} was marked as "${item.status}".`;
      const notif = await Notification.create({
        recipient: item.studentId,
        title: 'Attendance Updated',
        message: notifMessage,
        type: 'attendance',
        link: '/student/dashboard'
      });

      // Emit real-time notification to the student via Socket.io
      emitToUser(item.studentId, 'new_notification', {
        notification: notif,
        attendance: updated
      });
    }

    emitBroadcast('attendance_updated', { className, date: attendanceDate });

    res.json({
      success: true,
      message: `Successfully recorded attendance for ${savedRecords.length} students`,
      records: savedRecords
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get attendance for a class on a specific date (or 'all' for all registered students)
router.get('/class/:className', authenticate, async (req, res) => {
  try {
    let { className } = req.params;
    const { date } = req.query;

    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    let studentQuery = { role: 'student' };
    let attendanceQuery = { date: queryDate };

    if (className && className.trim().toLowerCase() !== 'all') {
      const cleanClass = className.trim();
      const escaped = cleanClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      studentQuery.className = new RegExp(`^${escaped}$`, 'i');
      attendanceQuery.className = new RegExp(`^${escaped}$`, 'i');
    }

    const students = await User.find(studentQuery).sort({ className: 1, rollNo: 1, name: 1 });
    const records = await Attendance.find(attendanceQuery);

    const attendanceMap = {};
    records.forEach((r) => {
      attendanceMap[r.student.toString()] = r;
    });

    const result = students.map((s) => ({
      student: s,
      status: attendanceMap[s._id.toString()] ? attendanceMap[s._id.toString()].status : 'Present',
      recordId: attendanceMap[s._id.toString()]?._id,
      remarks: attendanceMap[s._id.toString()]?.remarks || ''
    }));

    res.json({
      success: true,
      date: queryDate,
      className,
      students: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get student's personal attendance summary & history
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Students can only view their own, teachers and principal can view any
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view other students attendance' });
    }

    const records = await Attendance.find({ student: studentId }).sort({ date: -1 });
    const totalDays = records.length;
    const presentCount = records.filter((r) => r.status === 'Present').length;
    const absentCount = records.filter((r) => r.status === 'Absent').length;
    const lateCount = records.filter((r) => r.status === 'Late').length;

    const percentage = totalDays > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalDays) * 100) : 0;

    res.json({
      success: true,
      summary: {
        totalDays,
        presentCount,
        absentCount,
        lateCount,
        percentage,
        isWarning: totalDays > 0 && percentage < 75
      },
      history: records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Overall school & class-wise attendance statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const allRecords = await Attendance.find();
    const totalRecords = allRecords.length;
    const presentRecords = allRecords.filter((r) => r.status === 'Present').length;
    const lateRecords = allRecords.filter((r) => r.status === 'Late').length;
    const overallPercentage = totalRecords > 0 ? Math.round(((presentRecords + lateRecords * 0.5) / totalRecords) * 100) : 0;

    // Group by class
    const classMap = {};
    allRecords.forEach((r) => {
      if (!classMap[r.className]) {
        classMap[r.className] = { total: 0, present: 0, late: 0, absent: 0 };
      }
      classMap[r.className].total++;
      if (r.status === 'Present') classMap[r.className].present++;
      else if (r.status === 'Late') classMap[r.className].late++;
      else classMap[r.className].absent++;
    });

    const classBreakdown = Object.keys(classMap).map((cName) => {
      const item = classMap[cName];
      const pct = Math.round(((item.present + item.late * 0.5) / item.total) * 100);
      return {
        className: cName,
        attendanceRate: pct,
        totalSessions: item.total,
        present: item.present,
        absent: item.absent,
        late: item.late
      };
    });

    // Recent 7 days trend
    const dayTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dayRecords = allRecords.filter((r) => {
        const rDate = new Date(r.date);
        rDate.setHours(0, 0, 0, 0);
        return rDate.getTime() === d.getTime();
      });

      const dTotal = dayRecords.length;
      const dPresent = dayRecords.filter((r) => r.status === 'Present').length;
      const dLate = dayRecords.filter((r) => r.status === 'Late').length;
      const rate = dTotal > 0 ? Math.round(((dPresent + dLate * 0.5) / dTotal) * 100) : 0;

      dayTrends.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        date: d.toISOString().split('T')[0],
        rate
      });
    }

    res.json({
      success: true,
      overallPercentage,
      totalRecords,
      classBreakdown,
      dayTrends
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

