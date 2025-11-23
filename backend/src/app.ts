import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import { corsConfig } from './config/cors';
import { sessionConfig } from './config/session';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import apiRoutes from './routes/api.routes';
import { attachUser } from './middleware/auth';
import { attachAbility } from './middleware/attachAbility';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors(corsConfig));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session management
app.use(session(sessionConfig));

// Attach user to request (for all routes)
app.use(attachUser);

// Attach CASL ability to request (requires user from attachUser)
app.use(attachAbility);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// Error handling (must be last)
app.use(errorHandler);

export default app;
