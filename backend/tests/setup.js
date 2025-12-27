"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@/config/database");
const logger_1 = require("@/shared/utils/logger");
process.env['NODE_ENV'] = 'test';
jest.setTimeout(30000);
beforeAll(async () => {
    try {
        if (process.env['SKIP_DB_TESTS'] !== 'true') {
            await (0, database_1.connectDatabase)();
            logger_1.logger.info('Test database connected');
        }
    }
    catch (error) {
        logger_1.logger.warn('MongoDB not available, skipping database tests:', error);
        process.env['SKIP_DB_TESTS'] = 'true';
    }
});
afterEach(async () => {
    try {
        if (process.env['SKIP_DB_TESTS'] !== 'true') {
            await (0, database_1.clearDatabase)();
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to clear test database:', error);
    }
});
afterAll(async () => {
    try {
        if (process.env['SKIP_DB_TESTS'] !== 'true') {
            await (0, database_1.disconnectDatabase)();
            logger_1.logger.info('Test database disconnected');
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to disconnect from test database:', error);
    }
});
if (!process.env['LOG_LEVEL']) {
    logger_1.logger.silent = true;
}
//# sourceMappingURL=setup.js.map