import dotenv from 'dotenv';
import { logger } from '@/shared/utils/logger';

// Load environment variables
dotenv.config();

interface Config {
  // Server Configuration
  nodeEnv: string;
  port: number;
  apiVersion: string;

  // Database Configuration
  mongodbUri: string;
  mongodbTestUri: string;

  // JWT Configuration
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;

  // Redis Configuration
  redisUrl: string;
  redisPassword: string | undefined;

  // Email Configuration
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;

  // Security Configuration
  bcryptRounds: number;
  mfaIssuer: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;

  // File Upload Configuration
  maxFileSize: number;
  uploadPath: string;

  // Logging Configuration
  logLevel: string;
  logFile: string;

  // Jobs Configuration
  jobsEnabled: boolean;
}

const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGODB_URI',
];

// Validate required environment variables
const validateEnvironment = (): void => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};

// Validate environment on import
validateEnvironment();

export const config: Config = {
  // Server Configuration
  nodeEnv: process.env['NODE_ENV'] || 'development',
  port: parseInt(process.env['PORT'] || '3000', 10),
  apiVersion: process.env['API_VERSION'] || 'v1',

  // Database Configuration
  mongodbUri: process.env['MONGODB_URI']!,
  mongodbTestUri: process.env['MONGODB_TEST_URI'] || 'mongodb://localhost:27017/enterprise-hrms-test',

  // JWT Configuration
  jwtSecret: process.env['JWT_SECRET']!,
  jwtRefreshSecret: process.env['JWT_REFRESH_SECRET']!,
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
  jwtRefreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',

  // Redis Configuration
  redisUrl: process.env['REDIS_URL'] || 'redis://localhost:6379',
  redisPassword: process.env['REDIS_PASSWORD'],

  // Email Configuration
  smtpHost: process.env['SMTP_HOST'] || 'smtp.gmail.com',
  smtpPort: parseInt(process.env['SMTP_PORT'] || '587', 10),
  smtpUser: process.env['SMTP_USER'] || '',
  smtpPass: process.env['SMTP_PASS'] || '',
  fromEmail: process.env['FROM_EMAIL'] || 'noreply@company.com',

  // Security Configuration
  bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10),
  mfaIssuer: process.env['MFA_ISSUER'] || 'Enterprise HRMS',
  rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),

  // File Upload Configuration
  maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10), // 10MB
  uploadPath: process.env['UPLOAD_PATH'] || 'uploads/',

  // Logging Configuration
  logLevel: process.env['LOG_LEVEL'] || 'info',
  logFile: process.env['LOG_FILE'] || 'logs/app.log',

  // Jobs Configuration
  jobsEnabled: (process.env['JOBS_ENABLED'] || 'false').toLowerCase() === 'true',
};