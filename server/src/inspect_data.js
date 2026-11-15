const mongoose = require('mongoose');

async function inspectStudents() {
  await mongoose.connect('mongodb://127.0.0.1:27017/vidyacore');
  const students = await mongoose.connection.db.collection('users').find({ role: 'student' }).toArray();
  console.log(`=== ${students.length} STUDENTS IN DB ===`);
  students.forEach(s => {
    console.log(`ID: ${s._id} | Name: "${s.name}" | Email: "${s.email}" | Class: "${s.className}" | Roll: "${s.rollNo}"`);
  });

  const attendance = await mongoose.connection.db.collection('attendances').find({}).toArray();
  console.log(`\n=== ${attendance.length} ATTENDANCE RECORDS ===`);
  attendance.forEach(a => {
    console.log(`Student: ${a.student} | Class: "${a.className}" | Date: ${a.date} | Status: "${a.status}" | MarkedBy: ${a.markedBy}`);
  });

  const marks = await mongoose.connection.db.collection('marks').find({}).toArray();
  console.log(`\n=== ${marks.length} MARKS RECORDS ===`);
  marks.forEach(m => {
    console.log(`Student: ${m.student} | Subject: "${m.subject}" | Score: ${m.marksObtained}/${m.maxMarks} (${m.percentage}%) | Exam: "${m.examType}" | Teacher: ${m.teacher}`);
  });

  await mongoose.disconnect();
}

inspectStudents();

