import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/environment';
import { connectDatabase } from '@/config/database';
import { logger } from '@/shared/utils/logger';
import { errorHandler } from '@/shared/middleware/errorHandler';
import { requestLogger } from '@/shared/middleware/requestLogger';
import { enforceJsonContentType, performanceMonitor, sanitizeRequest } from '@/shared/middleware/security';
import authRoutes from '@/domains/auth/routes/authRoutes';
import employeeRoutes from '@/domains/employees/routes/employeeRoutes';
import leaveRoutes from '@/domains/leave/routes/leaveRoutes';
import { attendanceRoutes } from '@/domains/attendance/routes/attendanceRoutes';
import { payrollRoutes } from '@/domains/payroll/routes/payrollRoutes';
import { performanceRoutes } from '@/domains/performance/routes/performanceRoutes';
import { documentRoutes } from '@/domains/documents/routes/documentRoutes';
import { notificationRoutes } from '@/domains/notifications/routes/notificationRoutes';
import { initJobs } from '@/jobs';
// Swagger docs setup will be attempted dynamically to avoid test-time dependency issues

const app = express();

// Security middleware
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: false, // allow swagger-like UIs if added later while keeping other headers
}));
app.use(cors({
  origin: process.env['NODE_ENV'] === 'production' ? false : true,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input validation & performance monitoring
app.use(enforceJsonContentType);
app.use(sanitizeRequest);
app.use(performanceMonitor());

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API root and version info
app.get('/api', (_req, res) => {
  res.json({
    message: 'Enterprise HRMS API',
    version: config.apiVersion,
    environment: config.nodeEnv,
  });
});

// Versioned API base
const apiBase = `/api/${config.apiVersion}`;

// Back-compat unversioned mounts (consider deprecating later)
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);

// Versioned mounts
app.use(`${apiBase}/auth`, authRoutes);
app.use(`${apiBase}/employees`, employeeRoutes);
app.use(`${apiBase}/leaves`, leaveRoutes);
app.use(`${apiBase}/attendance`, attendanceRoutes);
app.use(`${apiBase}/payroll`, payrollRoutes);
app.use(`${apiBase}/performance`, performanceRoutes);
app.use(`${apiBase}/documents`, documentRoutes);
app.use(`${apiBase}/notifications`, notificationRoutes);

// Optional Swagger UI for API docs (skips if deps unavailable)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const swaggerUi = require('swagger-ui-express');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const swaggerJSDoc = require('swagger-jsdoc');
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Enterprise HRMS API',
        version: config.apiVersion,
        description: 'API documentation for Enterprise HRMS',
      },
      servers: [{ url: `http://localhost:${config.port}${apiBase}` }],
    },
    apis: [],
  };
  const swaggerSpec = swaggerJSDoc(options);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
  app.use(`${apiBase}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
} catch (err) {
  logger.warn('Swagger dependencies not installed, skipping API docs setup');
}

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });

    // Initialize background job processors (optional)
    initJobs();

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server if this file is run directly
if (require.main === module) {
  void startServer();
}

export { app, startServer };