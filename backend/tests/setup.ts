import { connectDatabase, disconnectDatabase, clearDatabase } from '@/config/database';
import { logger } from '@/shared/utils/logger';

// Set test environment
process.env['NODE_ENV'] = 'test';

// Increase timeout for database operations
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  try {
    // Only connect to database if MongoDB is available
    if (process.env['SKIP_DB_TESTS'] !== 'true') {
      await connectDatabase();
      logger.info('Test database connected');
    }
  } catch (error) {
    logger.warn('MongoDB not available, skipping database tests:', error);
    // Set flag to skip database-dependent tests
    process.env['SKIP_DB_TESTS'] = 'true';
  }
});

// Clean up after each test
afterEach(async () => {
  try {
    if (process.env['SKIP_DB_TESTS'] !== 'true') {
      await clearDatabase();
    }
  } catch (error) {
    logger.error('Failed to clear test database:', error);
  }
});

// Global test teardown
afterAll(async () => {
  try {
    if (process.env['SKIP_DB_TESTS'] !== 'true') {
      await disconnectDatabase();
      logger.info('Test database disconnected');
    }
  } catch (error) {
    logger.error('Failed to disconnect from test database:', error);
  }
});

// Suppress console logs during tests unless LOG_LEVEL is set
if (!process.env['LOG_LEVEL']) {
  logger.silent = true;
}