const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { clientOrigins } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Hosts such as Render sit behind a proxy; this makes rate limiting see the real client IP.
app.set('trust proxy', 1);

app.use(helmet());

// CORS: only the configured frontend origin(s) may call the API from a browser.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
  })
);

// JSON parsing must come before the routes, or req.body will be undefined.
app.use(express.json({ limit: '10kb' }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

app.use('/api', apiLimiter);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
