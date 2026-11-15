# 🎓 VidyaCore — Modern MERN Campus Management & Broadcast Suite

VidyaCore is a high-performance, full-stack School/College Management & Communication Web Application engineered with the **MERN Stack** (MongoDB, Express.js, React.js with Vite, Node.js), **Tailwind CSS**, and **Socket.io**, powered by an **AI Executive & Academic Engine**.

---

## 🌟 Highlights & Core Capabilities

### 1. Design System & UI/UX
- **Modern Glassmorphism & Clean SaaS Styling:** Inspired by Linear and Vercel, featuring frosted glass panels, subtle border rings, micro-interactions, and crisp typography.
- **Dual Theme Mode (Dark & Light):** Built using Tailwind CSS `dark:` variant and custom variants, with persistent theme preference saved in `localStorage`.
- **Responsive Navigation:**
  - Full-featured sidebar for desktop workstations.
  - Mobile slide-out drawer + bottom navigation bar for quick thumb reachability on tablets and phones.
- **Rich Data Visualizations (Recharts):**
  - Class-wise overall result percentages (pass rate vs average score bar charts).
  - 7-Day School-Wide Attendance trends (monotone gradient area chart).
  - Subject-wise marks distribution (highest, class average, lowest scores).

---

### 2. User Roles & Authentication (JWT + Role-Based Access)

| Role | Persona | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Principal** (Super Admin) | Dr. Rajesh Sharma | `principal@vidyacore.edu` | `password123` | Institutional Analytics, Student Census Directory, At-risk oversight, Broadcast admin, AI Campus Summary |
| **Teacher** (Class Admin) | Mr. Vikram Verma (10-A) | `teacher.verma@vidyacore.edu` | `password123` | 1-Click "Mark All Present" attendance, Marks entry with auto-grade calculation, AI Notice Writer |
| **Student (Good Att.)** | Aarav Patel (10-A) | `student.aarav@vidyacore.edu` | `password123` | Attendance gauge (96%), Subject scorecards, Printable Official Report Card, AI Study Coach |
| **Student (At-Risk)** | Rohan Mehta (10-A) | `student.rohan@vidyacore.edu` | `password123` | **Prominent Red Warning Badge** (< 75% attendance), failing grade alerts, Remedial action plan |

*Tip: The UI includes a **1-Click Demo Persona Switcher** on the Login screen and in the top navigation bar to test all three roles seamlessly without re-typing credentials!*

---

### 3. Real-Time Notifications & Broadcast Groups (Socket.io)
- **Bidirectional Sockets:** Instant real-time updates for new announcements, attendance logs, and exam marks.
- **In-App Toast Alerts & Notification Badges:** Automatic live toast notifications and an unread counter bell in the navbar.
- **Strict Student Restrictions:**
  - Students **CANNOT** type or submit text messages in broadcast groups (chat input is strictly hidden in the UI and enforced with 403 Forbidden on the backend).
  - Students can acknowledge and engage with announcements using **live emoji reactions** (`👍`, `❤️`, `✅`, `🙏`) with live counters synchronized across all connected devices via Socket.io.

---

### 4. AI-Powered Smart Features
1. **Principal AI Insights ("AI Campus Summary"):**
   - Automatically computes institutional health index (`Optimal`, `Moderate`, `Action Required`).
   - Identifies top-performing cohorts, flagged concerns, and automated governance directives.
2. **AI Notice Writer & Circular Polisher:**
   - **"✨ Polish with AI"** button inside the Teacher/Principal message composer.
   - Converts rough informal notes (e.g., *"tomorrow bring lab files 9am"*) into an authoritative, beautifully structured circular with custom tones: **Formal**, **Urgent**, or **Encouraging**.
3. **Student AI Performance Coach:**
   - Evaluates subject-wise deficits and generates a personalized 7-day study timetable utilizing spaced repetition and the Feynman Technique.
   - Issues warning advisories if the student's attendance drops below 75%.

---

## 🏗️ Project Architecture

```
VidyaCore/
├── package.json              # Root orchestration scripts
├── README.md
├── server/                   # Node.js + Express + Mongoose + Socket.io
│   ├── .env                  # Port, Mongo URI, JWT Secret, Gemini API Key
│   ├── package.json
│   └── src/
│       ├── config/db.js      # MongoDB connection
│       ├── models/           # Mongoose schemas: User, Attendance, Mark, Group, Message, Notification
│       ├── middleware/auth.js# JWT verification & role authorization (principal, teacher, student)
│       ├── routes/           # REST endpoints (/auth, /users, /attendance, /marks, /groups, /ai, /notifications)
│       ├── services/         # aiService.js (Gemini API with fallback NLP engine)
│       ├── socket.js         # Socket.io room management & broadcast events
│       ├── seed.js           # Comprehensive demo database seeder
│       └── server.js         # Main server entrypoint (port 5000)
└── client/                   # React 19 + Vite + Tailwind CSS v4 + Lucide + Recharts
    ├── vite.config.js        # Vite config with @tailwindcss/vite and /api proxy
    ├── package.json
    └── src/
        ├── api/axios.js      # Axios instance with JWT interceptor
        ├── context/          # AuthContext, ThemeContext, SocketContext
        ├── components/       # Navbar, Sidebar, ToastContainer
        ├── pages/            # Login, PrincipalDashboard, StudentDirectory, TeacherDashboard, StudentDashboard, BroadcastChannels, AiStudyCoach
        ├── index.css         # Tailwind v4 styles, dark mode variant, glassmorphism
        └── App.jsx           # Root layout and role routing
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** running locally on default port `27017` (e.g., `mongodb://127.0.0.1:27017/vidyacore`)

### 1. Install Dependencies
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 2. Seed Demo Database
Populates Principal, 3 Teachers, 9 Students across classes 10-A, 10-B, and 12-A, 14 days of historical attendance, exam marks, and announcement groups:
```bash
npm run seed
```

### 3. Launch Development Servers
From the root folder:
```bash
# Start backend server (http://localhost:5000)
npm run server

# In a second terminal, start frontend client (http://localhost:5173)
npm run client
```

Now open **`http://localhost:5173`** in your browser!

---

## 🔒 Security & Access Control
- Passwords securely hashed with **Bcrypt.js**.
- Protected API routes verified via stateless **JWT** bearer tokens.
- Strict Role-Based Access Control (RBAC) middleware guarantees students cannot manipulate attendance, marks, or post unauthorized messages.
- Real-time Socket.io handshake authenticated with the same JWT token.

