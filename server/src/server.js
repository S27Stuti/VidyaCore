const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const connectDB = require('./config/db');
const { initSocket } = require('./socket');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const marksRoutes = require('./routes/marks');
const groupRoutes = require('./routes/groups');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);

// Connect MongoDB
connectDB();

// Initialize Socket.io
initSocket(server);

// Ensure uploads folder exists and is statically served
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Middleware with 50mb body limit for multimedia uploads (audio, video, documents, images)
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'VidyaCore MERN Management Suite',
    timestamp: new Date().toISOString()
  });
});

// Serve static client assets in production if client/dist exists
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[VidyaCore Server] Running on port ${PORT}`);
  });
}

module.exports = app;

