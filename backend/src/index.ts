import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import problemRoutes from './routes/problems.js';
import submissionRoutes from './routes/submissions.js';
import userRoutes from './routes/users.js';
import assignmentRoutes from './routes/assignments.js';
import contestRoutes from './routes/contests.js';
import adminRoutes from './routes/admin.js';
import classRoutes from './routes/classes.js';
import syncRoutes from './routes/sync.js';
import discussionRoutes from './routes/discussions.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter, cleanupRateLimits } from './middleware/rateLimiter.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// Rate limiting
app.use('/api', generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (for uploaded college IDs)
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/discussions', discussionRoutes);

// Error handler
app.use(errorHandler);

// Cleanup rate limits every hour
setInterval(cleanupRateLimits, 60 * 60 * 1000);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 CodeLab Backend running on http://localhost:${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔄 Restarted at: ${new Date().toISOString()}`);
  });
}

export default app;

export { prisma };
