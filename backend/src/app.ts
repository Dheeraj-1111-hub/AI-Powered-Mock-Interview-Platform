import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import interviewRoutes from './routes/interviews.routes';
import dashboardRoutes from './routes/dashboard.routes';
import codesRoutes from './routes/codes.routes';
import resumeRoutes from './routes/resume.routes';
import careerRoutes from './routes/career.routes';
import { connectDatabase } from './services/db';

import morgan from 'morgan';

import logger from './services/logger';

const app = express();
app.set('trust proxy', true); // Trust the reverse proxy (e.g., Render, Cloudflare)

// PHASE 8: PRODUCTION HARDENING
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:8081", "https://api.groq.com"]
    }
  }
}));

app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

app.use(cors({ 
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'];
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 5000 : 10000,
  message: 'Intelligence rate limit exceeded. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }
});

app.use('/api', apiLimiter);

app.get('/health', (_, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/codes', codesRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/career', careerRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`[CRITICAL]: ${err.message}`, { stack: err.stack, path: req.path });
  res.status(err.status || 500).json({
    message: 'A secure intelligence error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

connectDatabase().then(async () => {
  logger.info('Production Database Connected');
}).catch((error) => {
  logger.error('Database connection failed', error);
  process.exit(1);
});

export default app;
