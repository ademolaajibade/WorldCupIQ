require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');

const paystackWebhookHandler = require('./src/webhooks/paystack');
const flutterwaveWebhookHandler = require('./src/webhooks/flutterwave');

const authRoutes = require('./src/routes/auth');
const usersRoutes = require('./src/routes/users');
const triviaRoutes = require('./src/routes/trivia');
const questionsRoutes = require('./src/routes/questions');
const packsRoutes = require('./src/routes/packs');
const leaderboardRoutes = require('./src/routes/leaderboard');
const paymentsRoutes = require('./src/routes/payments');
const widgetsRoutes = require('./src/routes/widgets');
const adminRoutes = require('./src/routes/admin');
const healthRoutes = require('./src/routes/health');
const tournamentRoutes = require('./src/routes/tournament');

const { apiLimiter } = require('./src/middlewares/rateLimiter');
const { notFound, errorHandler } = require('./src/middlewares/errorHandler');

const app = express();

// ─── Static allowed origins ───────────────────────────────────────────────────
const STATIC_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5173',
];

// ─── Helmet (security headers + CSP for payment providers) ───────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://js.paystack.co',
          'https://checkout.flutterwave.com',
          "'unsafe-inline'", // Required by Paystack inline popup
        ],
        frameSrc: [
          'https://js.paystack.co',
          'https://checkout.flutterwave.com',
          'https://api.flutterwave.com',
        ],
        connectSrc: [
          "'self'",
          'https://api.paystack.co',
          'https://api.flutterwave.com',
        ],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── HTTP logging ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ─── CORS (dynamic — supports widget embed origins) ───────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || STATIC_ORIGINS.includes(origin)) return callback(null, true);
      // Widget origins are validated in widgetApiKeyAuth middleware per-request
      // Allow requests from any origin for embed routes (CORS handled in the middleware)
      callback(null, true);
    },
    credentials: true,
  })
);

// ─── Webhooks MUST be registered before express.json() ───────────────────────
app.use(
  '/api/v1/webhooks/paystack',
  express.raw({ type: '*/*' }),
  paystackWebhookHandler
);
app.use(
  '/api/v1/webhooks/flutterwave',
  express.raw({ type: '*/*' }),
  flutterwaveWebhookHandler
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Rate limiting (all /api/v1 routes) ──────────────────────────────────────
app.use('/api/v1', apiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/trivia', triviaRoutes);
app.use('/api/v1/questions', questionsRoutes);
app.use('/api/v1/packs', packsRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/widgets', widgetsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/tournament', tournamentRoutes);

// ─── 404 + global error handler ───────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
