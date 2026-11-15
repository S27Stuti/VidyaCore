const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Mark = require('./models/Mark');
const Group = require('./models/Group');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vidyacore';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB:', mongoUri);

    // Clear existing collections
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Mark.deleteMany({});
    await Group.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    console.log('[Seeder] Cleaned existing collections');

    // 1. Create Principal
    const principal = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'principal@vidyacore.edu',
      password: 'password123',
      role: 'principal',
      phone: '+91 98765 00000',
      address: 'Administrative Block, VidyaCore Campus',
      designation: 'Head of Institution / Dean',
      profileCompleted: true,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=RajeshSharma'
    });

    // 2. Create Teachers
    const teacher1 = await User.create({
      name: 'Mr. Vikram Verma',
      email: 'teacher.verma@vidyacore.edu',
      password: 'password123',
      role: 'teacher',
      phone: '+91 98765 11111',
      className: '10-A',
      subject: 'Mathematics',
      designation: 'Senior Faculty',
      qualification: 'M.Sc. Mathematics, B.Ed',
      profileCompleted: true,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=VikramVerma'
    });

    const teacher2 = await User.create({
      name: 'Ms. Ananya Sen',
      email: 'teacher.sen@vidyacore.edu',
      password: 'password123',
      role: 'teacher',
      phone: '+91 98765 22222',
      className: '12-A',
      subject: 'Physics',
      designation: 'Senior PGT Physics',
      qualification: 'M.Sc. Physics, NET',
      profileCompleted: true,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AnanyaSen'
    });

    const teacher3 = await User.create({
      name: 'Mrs. Neha Gupta',
      email: 'teacher.gupta@vidyacore.edu',
      password: 'password123',
      role: 'teacher',
      phone: '+91 98765 33333',
      className: '10-B',
      subject: 'English',
      designation: 'Department Head English',
      qualification: 'M.A. English Literature',
      profileCompleted: true,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=NehaGupta'
    });

    // 3. Create Students
    const studentRaw = [
      // 10-A
      { name: 'Aarav Patel', email: 'student.aarav@vidyacore.edu', rollNo: '10A01', className: '10-A', phone: '+91 98111 00001', parent: '+91 98111 99991' },
      { name: 'Diya Roy', email: 'student.diya@vidyacore.edu', rollNo: '10A02', className: '10-A', phone: '+91 98111 00002', parent: '+91 98111 99992' },
      { name: 'Rohan Mehta', email: 'student.rohan@vidyacore.edu', rollNo: '10A03', className: '10-A', phone: '+91 98111 00003', parent: '+91 98111 99993' }, // At-risk
      { name: 'Sneha Nair', email: 'student.sneha@vidyacore.edu', rollNo: '10A04', className: '10-A', phone: '+91 98111 00004', parent: '+91 98111 99994' },
      // 10-B
      { name: 'Kabir Joshi', email: 'student.kabir@vidyacore.edu', rollNo: '10B01', className: '10-B', phone: '+91 98222 00001', parent: '+91 98222 99991' },
      { name: 'Anika Mehra', email: 'student.anika@vidyacore.edu', rollNo: '10B02', className: '10-B', phone: '+91 98222 00002', parent: '+91 98222 99992' }, // At-risk
      { name: 'Aryan Khan', email: 'student.aryan@vidyacore.edu', rollNo: '10B03', className: '10-B', phone: '+91 98222 00003', parent: '+91 98222 99993' },
      // 12-A
      { name: 'Priya Deshmukh', email: 'student.priya@vidyacore.edu', rollNo: '12A01', className: '12-A', phone: '+91 98333 00001', parent: '+91 98333 99991' },
      { name: 'Devansh Reddy', email: 'student.devansh@vidyacore.edu', rollNo: '12A02', className: '12-A', phone: '+91 98333 00002', parent: '+91 98333 99992' }
    ];

    const students = [];
    for (const s of studentRaw) {
      const studentDoc = await User.create({
        name: s.name,
        email: s.email,
        password: 'password123',
        role: 'student',
        rollNo: s.rollNo,
        className: s.className,
        phone: s.phone,
        parentContact: s.parent,
        address: 'Sector 4, University Enclave',
        profileCompleted: true,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s.name)}`
      });
      students.push(studentDoc);
    }

    console.log(`[Seeder] Seeded 1 Principal, 3 Teachers, ${students.length} Students`);

    // 4. Seed Attendance (past 14 days)
    const today = new Date();
    const attendanceRecords = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      // Skip Sundays
      if (d.getDay() === 0) continue;

      for (const st of students) {
        let status = 'Present';

        // Rohan Mehta (at-risk attendance < 75%)
        if (st.name === 'Rohan Mehta') {
          if (i % 2 === 0 || i % 5 === 0) status = 'Absent';
          else if (i % 3 === 0) status = 'Late';
        } else if (st.name === 'Anika Mehra') {
          // Anika Mehra (< 75%)
          if (i % 3 === 0) status = 'Absent';
          else if (i % 4 === 0) status = 'Late';
        } else {
          // General realistic attendance (92%+)
          if (i === 4 && st.name === 'Sneha Nair') status = 'Absent';
          else if (i === 7 && st.name === 'Aryan Khan') status = 'Late';
          else if (i === 11 && st.name === 'Aarav Patel') status = 'Late';
        }

        attendanceRecords.push({
          student: st._id,
          className: st.className,
          date: d,
          status,
          markedBy: teacher1._id,
          remarks: status === 'Late' ? 'Arrived after 8:15 AM' : ''
        });
      }
    }

    await Attendance.insertMany(attendanceRecords);
    console.log(`[Seeder] Seeded ${attendanceRecords.length} attendance records`);

    // 5. Seed Marks
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science'];
    const markDocs = [];

    const getScore = (studentName, subject) => {
      if (studentName === 'Rohan Mehta') {
        if (subject === 'Mathematics') return 34; // Failing grade
        if (subject === 'Physics') return 48;
        return 55;
      }
      if (studentName === 'Diya Roy') {
        if (subject === 'Mathematics') return 96;
        if (subject === 'Computer Science') return 98;
        return 92;
      }
      if (studentName === 'Aarav Patel') {
        if (subject === 'Mathematics') return 88;
        if (subject === 'Physics') return 84;
        if (subject === 'Chemistry') return 78;
        if (subject === 'English') return 82;
        return 90;
      }
      if (studentName === 'Anika Mehra') {
        if (subject === 'Chemistry') return 38; // Fail
        return 62;
      }
      return 70 + Math.floor(Math.random() * 25);
    };

    for (const st of students) {
      for (const sub of subjects) {
        const score = getScore(st.name, sub);
        const max = 100;
        const pct = score;
        let grade = 'B';
        if (pct >= 90) grade = 'A+';
        else if (pct >= 80) grade = 'A';
        else if (pct >= 70) grade = 'B+';
        else if (pct >= 60) grade = 'B';
        else if (pct >= 50) grade = 'C';
        else if (pct >= 40) grade = 'D';
        else grade = 'F';

        markDocs.push({
          student: st._id,
          className: st.className,
          examType: 'Midterm',
          subject: sub,
          marksObtained: score,
          maxMarks: max,
          percentage: pct,
          grade,
          teacher: teacher1._id,
          remarks: score < 40 ? 'Needs intensive remedial support' : score >= 85 ? 'Exemplary conceptual clarity' : 'Good steady progress'
        });
      }
    }

    await Mark.insertMany(markDocs);
    console.log(`[Seeder] Seeded ${markDocs.length} marks entries`);

    // 6. Create Announcement Groups
    const groupGlobal = await Group.create({
      name: '📢 VidyaCore Official Notices',
      description: 'Central campus-wide bulletins, holiday announcements, and board exam circulars.',
      className: 'All',
      isGlobal: true,
      bannerColor: 'indigo',
      createdBy: principal._id,
      admins: [principal._id, teacher1._id, teacher2._id, teacher3._id],
      members: students.map((s) => s._id)
    });

    const group10A = await Group.create({
      name: '📘 Class 10-A Academic Forum',
      description: 'Daily assignments, syllabus updates, and lab practical schedules for Class 10-A.',
      className: '10-A',
      isGlobal: false,
      bannerColor: 'cyan',
      createdBy: teacher1._id,
      admins: [teacher1._id, principal._id],
      members: students.filter((s) => s.className === '10-A').map((s) => s._id)
    });

    const group12A = await Group.create({
      name: '🚀 Senior Secondary STEM Circle',
      description: 'Physics numericals, competitive test prep, and research fair announcements.',
      className: '12-A',
      isGlobal: false,
      bannerColor: 'emerald',
      createdBy: teacher2._id,
      admins: [teacher2._id, principal._id],
      members: students.filter((s) => s.className === '12-A').map((s) => s._id)
    });

    // 7. Seed Messages with Student Reactions
    const aarav = students.find((s) => s.name === 'Aarav Patel');
    const diya = students.find((s) => s.name === 'Diya Roy');
    const rohan = students.find((s) => s.name === 'Rohan Mehta');
    const priya = students.find((s) => s.name === 'Priya Deshmukh');

    const msg1 = await Message.create({
      group: groupGlobal._id,
      sender: principal._id,
      senderRole: 'principal',
      content: `Welcome to the Mid-Semester Academic Term 2026. All students are advised to maintain a minimum of 75% attendance to qualify for the annual board exam roll numbers. Remedial sessions start this Monday.`,
      priority: 'announcement',
      pinned: true,
      reactions: [
        { emoji: '👍', user: aarav._id },
        { emoji: '🙏', user: diya._id },
        { emoji: '✅', user: rohan._id }
      ]
    });

    const msg2 = await Message.create({
      group: group10A._id,
      sender: teacher1._id,
      senderRole: 'teacher',
      content: `Class 10-A: Mathematics Chapter 4 (Quadratic Equations) problem sets have been uploaded. Please submit problems 1-15 in your notebooks by Thursday.`,
      priority: 'normal',
      reactions: [
        { emoji: '👍', user: aarav._id },
        { emoji: '❤️', user: diya._id }
      ]
    });

    const msg3 = await Message.create({
      group: groupGlobal._id,
      sender: teacher2._id,
      senderRole: 'teacher',
      content: `Annual Science & Robotics Innovation Fair registrations are now open. Interested teams from Classes 10 through 12 must submit project abstracts to the physics lab by next Friday.`,
      priority: 'urgent',
      reactions: [
        { emoji: '❤️', user: priya._id },
        { emoji: '👍', user: aarav._id },
        { emoji: '✅', user: diya._id }
      ]
    });

    // 8. Seed Notifications for Aarav and Rohan
    await Notification.create({
      recipient: aarav._id,
      title: '📢 New Notice in VidyaCore Official Notices',
      message: 'Dr. Rajesh Sharma: "Welcome to the Mid-Semester Academic Term 2026..."',
      type: 'announcement',
      link: '/channels',
      read: false
    });

    await Notification.create({
      recipient: aarav._id,
      title: 'New Marks Entered',
      message: 'Mathematics (Midterm): You scored 88/100 (88%, Grade A).',
      type: 'marks',
      link: '/student/dashboard',
      read: true
    });

    await Notification.create({
      recipient: rohan._id,
      title: '⚠️ Attendance Warning Alert',
      message: 'Your overall attendance is currently 68%, which is below the mandatory 75% requirement.',
      type: 'attendance',
      link: '/student/dashboard',
      read: false
    });

    console.log('[Seeder] Database seeding completed successfully! ✨');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]', error);
    process.exit(1);
  }
};

seedData();
