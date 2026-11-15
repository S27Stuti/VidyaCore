const mongoose = require('mongoose');

async function inspectTeachers() {
  await mongoose.connect('mongodb://127.0.0.1:27017/vidyacore');
  const teachers = await mongoose.connection.db.collection('users').find({ role: 'teacher' }).toArray();
  console.log(`=== ${teachers.length} TEACHERS IN DB ===`);
  teachers.forEach(t => {
    console.log(`ID: ${t._id} | Name: "${t.name}" | Email: "${t.email}" | Class: "${t.className}" | Subject: "${t.subject}"`);
  });
  await mongoose.disconnect();
}

inspectTeachers();

