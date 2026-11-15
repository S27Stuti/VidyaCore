const mongoose = require('mongoose');

async function testFlow() {
  await mongoose.connect('mongodb://127.0.0.1:27017/vidyacore');
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Attendance = mongoose.model('Attendance', new mongoose.Schema({}, { strict: false }));
  const Mark = mongoose.model('Mark', new mongoose.Schema({}, { strict: false }));
  const Group = mongoose.model('Group', new mongoose.Schema({}, { strict: false }));
  const Message = mongoose.model('Message', new mongoose.Schema({}, { strict: false }));

  const users = await User.find({}, { name: 1, email: 1, role: 1, className: 1, rollNo: 1 }).lean();
  console.log(`\n=== REGISTERED USERS (${users.length}) ===`);
  users.forEach(u => console.log(`- [${u.role.toUpperCase()}] ${u.name} (${u.email}) | Class: ${u.className || 'N/A'}, Roll: ${u.rollNo || 'N/A'}`));

  const attendanceCount = await Attendance.countDocuments();
  const marksCount = await Mark.countDocuments();
  const groupsCount = await Group.countDocuments();
  const messagesCount = await Message.countDocuments();

  console.log(`\n=== DATABASE RECORDS ===`);
  console.log(`Attendance Records: ${attendanceCount}`);
  console.log(`Marks Records: ${marksCount}`);
  console.log(`Groups: ${groupsCount}`);
  console.log(`Messages: ${messagesCount}`);

  process.exit(0);
}

testFlow().catch(err => {
  console.error(err);
  process.exit(1);
});

