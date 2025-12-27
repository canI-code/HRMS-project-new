import mongoose from 'mongoose';
import { config } from '@/config/environment';
import { logger } from '@/shared/utils/logger';

interface DatabaseConnection {
  isConnected: boolean;
  connection?: typeof mongoose;
}

const dbConnection: DatabaseConnection = {
  isConnected: false,
};

export const connectDatabase = async (): Promise<typeof mongoose> => {
  try {
    if (dbConnection.isConnected && dbConnection.connection) {
      logger.info('Using existing database connection');
      return dbConnection.connection;
    }

    const mongoUri = config.nodeEnv === 'test' ? config.mongodbTestUri : config.mongodbUri;
    
    logger.info(`Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);

    const connection = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connected successfully');
      dbConnection.isConnected = true;
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
      dbConnection.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      dbConnection.isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    dbConnection.connection = connection;
    dbConnection.isConnected = true;

    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    dbConnection.isConnected = false;
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (dbConnection.isConnected) {
      await mongoose.connection.close();
      dbConnection.isConnected = false;
      logger.info('Database disconnected successfully');
    }
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
    throw error;
  }
};

export const clearDatabase = async (): Promise<void> => {
  try {
    if (config.nodeEnv === 'test' && dbConnection.isConnected) {
      const collections = mongoose.connection.collections;
      
      for (const key in collections) {
        const collection = collections[key];
        if (collection) {
          await collection.deleteMany({});
        }
      }
      
      logger.info('Test database cleared');
    }
  } catch (error) {
    logger.error('Error clearing test database:', error);
    throw error;
  }
};

export { dbConnection };