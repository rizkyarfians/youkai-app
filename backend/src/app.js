const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./modules/auth/auth.routes');
const organizationRoutes = require('./modules/organizations/organization.routes');
const memberRoutes = require('./modules/members/member.routes');
const roleRoutes = require('./modules/roles/role.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const eventRoutes = require('./modules/events/event.routes');
const lineupRoutes = require('./modules/lineups/lineup.routes');

const errorMiddleware = require('./middlewares/error.middleware');

const app = express();
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Youkai Management API is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/lineups', lineupRoutes);
app.use(errorMiddleware);

module.exports = app;
