const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/vidyacore');
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log(`Found ${users.length} users:`);
  users.forEach(u => {
    console.log(`ROLE: ${u.role} | EMAIL: ${u.email} | NAME: ${u.name} | PASS_HASH: ${u.password ? u.password.substring(0, 15) : 'none'}...`);
  });
  await mongoose.disconnect();
}

main();

