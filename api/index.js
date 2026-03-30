// api/index.js — Main Express server (Vercel serverless entry point)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('../lib/db');

// ─── Route imports ─────────────────────────────────────────────────
const contactRoutes = require('../routes/contact');
const noticeRoutes = require('../routes/notices');
const admissionRoutes = require('../routes/admission');

const app = express();

// ─── Security Headers ─────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5500',       // VS Code Live Server default
  'http://127.0.0.1:5500',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Body Parser ──────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Rate Limiting ────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
});

// Stricter limit for form submissions
const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, message: 'Too many submissions. Please wait before trying again.' },
});

app.use('/api/', apiLimiter);

// ─── DB Connection Middleware ─────────────────────────────────────
// Connects once and reuses cached connection (critical for Vercel serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err);
    res.status(503).json({ success: false, message: 'Database connection failed. Try again later.' });
  }
});

// ─── Health Check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    server: 'Kolkata High School API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── Routes ──────────────────────────────────────────────────────
app.use('/api/contact', formLimiter, contactRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/admission', formLimiter, admissionRoutes);

// ─── Root ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🎓 Kolkata High School API',
    version: '1.0.0',
    endpoints: {
      health:    'GET  /api/health',
      notices:   'GET  /api/notices',
      contact:   'POST /api/contact',
      admission: 'POST /api/admission',
    },
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start (local dev only — Vercel handles this itself) ──────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📋 API docs at  http://localhost:${PORT}/`);
  });
}

// Export for Vercel serverless
module.exports = app;
