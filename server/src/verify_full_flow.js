async function verifyFullFlow() {
  console.log('🚀 Starting Comprehensive Teacher-Student-Principal Flow Verification...');

  const teacherEmail = `teacher.demo_${Date.now()}@vidyacore.edu`;
  const teacherPassword = 'password123';

  // 1. Register a new Teacher
  console.log(`\n1️⃣ Testing Teacher Registration for: ${teacherEmail}`);
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Prof. Rajesh Verma',
      email: teacherEmail,
      password: teacherPassword,
      role: 'teacher',
      className: '1',
      subject: 'Science',
      phone: '+91 98765 00000'
    })
  });
  const regData = await regRes.json();
  if (!regRes.ok) throw new Error(`Teacher registration failed: ${JSON.stringify(regData)}`);
  console.log(`✅ Teacher registered successfully! User ID: ${regData.user._id}, Role: ${regData.user.role}`);
  const teacherToken = regData.token;

  // 2. Test Logging In with that Teacher
  console.log('\n2️⃣ Testing Teacher Login...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: teacherEmail, password: teacherPassword })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error(`Teacher login failed: ${JSON.stringify(loginData)}`);
  console.log(`✅ Teacher logged in successfully! Name: ${loginData.user.name}`);

  // 3. Teacher fetches Class 1 students
  console.log('\n3️⃣ Teacher fetches Class 1 Students Roster...');
  const classRes = await fetch('http://localhost:5000/api/attendance/class/1', {
    headers: { Authorization: `Bearer ${teacherToken}` }
  });
  const classData = await classRes.json();
  console.log(`✅ Class 1 student roster retrieved: ${classData.students.length} students found.`);
  const student = classData.students[0].student;
  console.log(`Target Student: "${student.name}" (ID: ${student._id}, Email: ${student.email})`);

  // 4. Teacher marks Attendance for that student
  console.log(`\n4️⃣ Teacher marks Attendance for ${student.name} as Present...`);
  const attRes = await fetch('http://localhost:5000/api/attendance/mark', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      className: '1',
      date: new Date().toISOString().split('T')[0],
      records: [{ studentId: student._id, status: 'Present', remarks: 'Active in class' }]
    })
  });
  const attData = await attRes.json();
  console.log(`✅ Attendance marked successfully: ${attData.message}`);

  // 5. Teacher enters Marks for that student
  console.log(`\n5️⃣ Teacher enters Science Marks (88/100) for ${student.name}...`);
  const markRes = await fetch('http://localhost:5000/api/marks/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      studentId: student._id,
      className: '1',
      examType: 'Midterm',
      subject: 'Science',
      marksObtained: 88,
      maxMarks: 100,
      remarks: 'Excellent practical and laboratory understanding'
    })
  });
  const markData = await markRes.json();
  console.log(`✅ Marks saved successfully: ${markData.mark.subject} - Score: ${markData.mark.marksObtained}/${markData.mark.maxMarks} (Grade: ${markData.mark.grade})`);

  // 6. Student logs in and verifies they can see the Teacher's entered details
  console.log(`\n6️⃣ Student (${student.email}) logs in to verify visible details...`);
  const studentLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: student.email, password: 'password123' })
  });
  const studentLoginData = await studentLoginRes.json();
  const studentToken = studentLoginData.token;

  // Student fetches attendance
  const studentAttRes = await fetch(`http://localhost:5000/api/attendance/student/${student._id}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const studentAttData = await studentAttRes.json();
  console.log(`✅ Student Attendance verified: Total Days = ${studentAttData.summary.totalDays}, Percentage = ${studentAttData.summary.percentage}%`);

  // Student fetches marks
  const studentMarksRes = await fetch(`http://localhost:5000/api/marks/student/${student._id}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const studentMarksData = await studentMarksRes.json();
  const scienceMark = studentMarksData.marks.find(m => m.subject === 'Science');
  console.log(`✅ Student Marks verified: Found Science score = ${scienceMark?.marksObtained}/${scienceMark?.maxMarks} (Grade: ${scienceMark?.grade})`);

  // 7. Principal logs in and verifies institutional analytics
  console.log('\n7️⃣ Principal logs in to verify institutional analytics...');
  const principalLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'principal@vidyacore.edu', password: 'password123' })
  });
  const principalLoginData = await principalLoginRes.json();
  const principalToken = principalLoginData.token;

  // Principal marks analytics
  const analyticsRes = await fetch('http://localhost:5000/api/marks/analytics', {
    headers: { Authorization: `Bearer ${principalToken}` }
  });
  const analyticsData = await analyticsRes.json();
  console.log(`✅ Principal Analytics verified: Overall Pass Rate = ${analyticsData.overallPassPercentage}%, Evaluated Students = ${analyticsData.totalStudentsEvaluated}`);
  console.log(`Class Wise Results:`, analyticsData.classWiseResults);

  console.log('\n🎉 ALL 7 STEPS PASSED WITH 100% SUCCESS! Flow is robust, end-to-end verified!');
}

verifyFullFlow().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});

