const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
  await mongoose.connect('mongodb://127.0.0.1:27017/vidyacore');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password123', salt);

  const res = await mongoose.connection.db.collection('users').updateMany(
    { email: { $in: ['stutu2004shah@gmail.com', 'teacher.verma@vidyacore.edu', 'principal@vidyacore.edu', '22csd16@gmail.com'] } },
    { $set: { password: hash } }
  );

  console.log(`Updated ${res.modifiedCount} accounts with password123`);
  await mongoose.disconnect();
}

resetPasswords();

