const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const { authenticate, authorize } = require('../middleware/auth');

// Get list of distinct classes from registered students
router.get('/classes', authenticate, async (req, res) => {
  try {
    const rawClasses = await User.find({ role: 'student' }).distinct('className');
    const classes = rawClasses
      .filter(Boolean)
      .map((c) => c.trim())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();

    res.json({
      success: true,
      classes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all students with aggregated attendance and average marks
router.get('/students', authenticate, async (req, res) => {
  try {
    const { className, search } = req.query;
    let query = { role: 'student' };

    if (className && className !== 'All') {
      query.className = className;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query).sort({ className: 1, rollNo: 1 });

    // Aggregate attendance % and marks for each student
    const studentData = await Promise.all(
      students.map(async (student) => {
        const attendanceRecords = await Attendance.find({ student: student._id });
        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter((a) => a.status === 'Present').length;
        const lateDays = attendanceRecords.filter((a) => a.status === 'Late').length;
        const attendancePercentage = totalDays > 0 ? Math.round(((presentDays + lateDays * 0.5) / totalDays) * 100) : 0;

        const marks = await Mark.find({ student: student._id });
        const totalMarksObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
        const totalMaxMarks = marks.reduce((sum, m) => sum + m.maxMarks, 0);
        const averageScore = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;

        return {
          ...student.toJSON(),
          attendancePercentage,
          totalAttendanceDays: totalDays,
          averageScore,
          marksCount: marks.length,
          isAtRisk: (totalDays > 0 && attendancePercentage < 75) || (marks.length > 0 && averageScore < 40)
        };
      })
    );

    res.json({
      success: true,
      count: studentData.length,
      students: studentData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all teachers
router.get('/teachers', authenticate, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).sort({ name: 1 });
    res.json({
      success: true,
      teachers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update currently authenticated user's profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const {
      name,
      phone,
      rollNo,
      className,
      section,
      subject,
      parentContact,
      address,
      qualification,
      designation,
      bio,
      avatar
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (rollNo !== undefined) user.rollNo = rollNo.trim();
    if (className !== undefined) user.className = className.trim();
    if (section !== undefined) user.section = section.trim();
    if (subject !== undefined) user.subject = subject.trim();
    if (parentContact !== undefined) user.parentContact = parentContact.trim();
    if (address !== undefined) user.address = address.trim();
    if (qualification !== undefined) user.qualification = qualification.trim();
    if (designation !== undefined) user.designation = designation.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar) user.avatar = avatar;

    user.profileCompleted = true;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get complete student portfolio (Profile + all attendance + all marks) for Teacher / Principal
router.get('/student/:id/portfolio', authenticate, authorize('teacher', 'principal'), async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const attendanceRecords = await Attendance.find({ student: student._id })
      .populate('markedBy', 'name role')
      .sort({ date: -1 });

    const marksRecords = await Mark.find({ student: student._id })
      .populate('teacher', 'name role')
      .sort({ createdAt: -1 });

    const totalDays = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a) => a.status === 'Present').length;
    const absentCount = attendanceRecords.filter((a) => a.status === 'Absent').length;
    const lateCount = attendanceRecords.filter((a) => a.status === 'Late').length;
    const attendancePct = totalDays > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalDays) * 100) : 0;

    const totalMarksObtained = marksRecords.reduce((sum, m) => sum + m.marksObtained, 0);
    const totalMaxMarks = marksRecords.reduce((sum, m) => sum + m.maxMarks, 0);
    const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100 * 10) / 10 : 0;

    let overallGrade = '—';
    if (totalMaxMarks > 0) {
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
      attendance: {
        totalDays,
        presentCount,
        absentCount,
        lateCount,
        attendancePct,
        records: attendanceRecords
      },
      marks: {
        totalSubjects: marksRecords.length,
        totalMarksObtained,
        totalMaxMarks,
        overallPercentage,
        overallGrade,
        records: marksRecords
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Edit student details by Teacher or Principal
router.put('/student/:id', authenticate, authorize('teacher', 'principal'), async (req, res) => {
  try {
    const { name, rollNo, className, phone, parentContact, section } = req.body;
    const student = await User.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (name) student.name = name.trim();
    if (rollNo !== undefined) student.rollNo = rollNo.trim();
    if (className !== undefined) student.className = className.trim();
    if (phone !== undefined) student.phone = phone.trim();
    if (parentContact !== undefined) student.parentContact = parentContact.trim();
    if (section !== undefined) student.section = section.trim();

    await student.save();

    res.json({
      success: true,
      message: 'Student details updated successfully',
      student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user profile details
router.get('/profile/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

