import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';

import emailRoutes from './routes/email.routes.js';
import investigationsRoutes from './routes/investigations.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import indicatorsRoutes from './routes/indicators.routes.js';
import evidenceRoutes from './routes/evidence.routes.js';
import auditRoutes from './routes/audit.routes.js';
import integrationsRoutes from './routes/integrations.routes.js';
import agentRoutes from './routes/agents.routes.js';

const app = express();

// Security & Middleware
app.use(helmet());
// CORS Configuration
const allowedOrigins = [
  env.CLIENT_URL,
  env.CLIENT_URL.replace(/\/$/, ''),
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive CORS for deployed Vercel previews while allowing credentials
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiter (150 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

app.use('/api', limiter);

// Root & API Health Check Endpoints (for Render & Load Balancers)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'mailtrace-api' });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'mailtrace-api',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/email', emailRoutes);
app.use('/api/investigations', investigationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/indicators', indicatorsRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/agents', agentRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = parseInt(env.PORT, 10) || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` MailTrace AI Backend Express Server running on port ${PORT}`);
  console.log(` Bound to 0.0.0.0 (Production Ready)`);
  console.log(` API Health Check: http://localhost:${PORT}/health`);
  console.log(` Client Origin: ${env.CLIENT_URL}`);
  console.log(`====================================================`);
});

