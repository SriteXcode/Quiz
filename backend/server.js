require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const previousWorkRoutes = require('./routes/previousWorkRoutes');
const quizRoutes = require('./routes/quizRoutes');
const shortGyaanRoutes = require('./routes/shortGyaanRoutes');
const siteRoutes = require('./routes/siteRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();

// Connect Database
connectDB();

// CORS Configuration based on environment variable (e.g., http://localhost:5173,http://localhost:5174)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy error: Origin '${origin}' not allowed.`));
      }
    },
    credentials: true
  })
);

// Global Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'Online',
    message: 'brainArena Backend API Engine is running.',
    allowedOrigins,
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/previous-works', previousWorkRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/shorts', shortGyaanRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.originalUrl}`
  });
});

// Start Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server Started]: Listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  console.log(`[CORS Allowed Origins]:`, allowedOrigins);
});
