import * as fc from 'fast-check';
import { auditLogStore, auditLogger } from '@/shared/middleware/auditLogger';
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { objectIdArbitrary, userRoleArbitrary } from '../utils/generators';

/**
 * **Feature: enterprise-hrms, Property 43: Audit log immutability**
 * **Validates: Requirements 9.3**
 */
describe('Audit Logger Property Tests', () => {
  beforeEach(() => {
    auditLogStore.clear();
  });

  afterEach(() => {
    auditLogStore.clear();
  });

  // Generator for HTTP methods
  const httpMethodArbitrary = () =>
    fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE');

  // Generator for HTTP status codes
  const statusCodeArbitrary = () =>
    fc.oneof(
      fc.constantFrom(200, 201, 204), // Success codes
      fc.constantFrom(400, 401, 403, 404, 422, 500) // Error codes
    );

  // Generator for user context
  const userContextArbitrary = () =>
    fc.record({
      userId: objectIdArbitrary(),
      organizationId: objectIdArbitrary(),
      userRole: userRoleArbitrary(),
      requestId: fc.string({ minLength: 8, maxLength: 32 }),
      ipAddress: fc.string({ minLength: 7, maxLength: 15 }),
      userAgent: fc.string({ minLength: 10, maxLength: 100 }),
    });

  // Generator for request data
  const requestDataArbitrary = () =>
    fc.record({
      method: httpMethodArbitrary(),
      url: fc.string({ minLength: 1, maxLength: 100 }),
      body: fc.option(fc.record({
        name: fc.string(),
        value: fc.string(),
      })),
    });

  // Mock request object
  const createMockRequest = (userContext: any, requestData: any): any => ({
    user: userContext,
    method: requestData.method,
    url: requestData.url,
    body: requestData.body,
    params: {},
    query: {},
    ip: userContext.ipAddress,
    requestId: userContext.requestId,
    get: (header: string) => {
      if (header === 'User-Agent') return userContext.userAgent;
      return undefined;
    },
  });

  // Mock response object
  const createMockResponse = (statusCode: number): any => {
    const listeners: { [event: string]: Function[] } = {};
    
    return {
      statusCode,
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      on: jest.fn((event: string, callback: Function) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
      }),
      emit: (event: string) => {
        if (listeners[event]) {
          listeners[event].forEach(callback => callback());
        }
      },
    };
  };

  describe('Property 43: Audit log immutability', () => {
    it('should create immutable audit log entries for all user actions', () => {
      fc.assert(
        fc.property(
          userContextArbitrary(),
          requestDataArbitrary(),
          statusCodeArbitrary(),
          (userContext, requestData, statusCode) => {
            auditLogStore.clear();
            
            const mockReq = createMockRequest(userContext, requestData);
            const mockRes = createMockResponse(statusCode);
            const mockNext: NextFunction = jest.fn();

            // Execute audit logger middleware
            const middleware = auditLogger();
            middleware(mockReq as Request, mockRes as Response, mockNext);

            // Simulate response finish
            mockRes.emit('finish');

            // Check that audit log was created
            const logs = auditLogStore.getAll();
            expect(logs.length).toBe(1);

            const auditLog = logs[0];
            
            // Verify audit log exists
            expect(auditLog).toBeDefined();
            if (!auditLog) return; // Type guard
            
            // Verify audit log contains required immutable fields
            expect(auditLog._id).toBeInstanceOf(Types.ObjectId);
            expect(auditLog.organizationId.toString()).toBe(userContext.organizationId.toString());
            expect(auditLog.userId.toString()).toBe(userContext.userId.toString());
            expect(auditLog.action).toBeDefined();
            expect(auditLog.resource).toBeDefined();
            expect(auditLog.metadata).toBeDefined();
            expect(auditLog.metadata.timestamp).toBeInstanceOf(Date);
            expect(auditLog.success).toBe(statusCode < 400);

            // Test immutability - modifying the returned object should not affect stored version
            const originalTimestamp = new Date(auditLog.metadata.timestamp.getTime());
            const originalUserId = auditLog.userId.toString();
            
            // Attempt to modify the log
            auditLog.metadata.timestamp = new Date('2000-01-01');
            auditLog.userId = new Types.ObjectId();
            
            // Retrieve log again and verify it hasn't changed (true immutability)
            const retrievedLogs = auditLogStore.getAll();
            const retrievedLog = retrievedLogs[0];
            
            expect(retrievedLog).toBeDefined();
            if (!retrievedLog) return; // Type guard
            
            expect(retrievedLog.metadata.timestamp).toEqual(originalTimestamp);
            expect(retrievedLog.userId.toString()).toBe(originalUserId);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain audit log integrity across multiple operations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(userContextArbitrary(), requestDataArbitrary(), statusCodeArbitrary()),
            { minLength: 1, maxLength: 5 }
          ),
          (operations) => {
            auditLogStore.clear();
            
            const expectedLogCount = operations.length;

            // Execute multiple operations
            operations.forEach(([userContext, requestData, statusCode]) => {
              const mockReq = createMockRequest(userContext, requestData);
              const mockRes = createMockResponse(statusCode);
              const mockNext: NextFunction = jest.fn();

              const middleware = auditLogger();
              middleware(mockReq as Request, mockRes as Response, mockNext);
              mockRes.emit('finish');
            });

            // Verify all logs were created
            const logs = auditLogStore.getAll();
            expect(logs.length).toBe(expectedLogCount);

            // Verify each log has unique ID and proper structure
            const logIds = new Set<string>();
            logs.forEach((log: any) => {
              expect(log._id).toBeInstanceOf(Types.ObjectId);
              expect(logIds.has(log._id.toString())).toBe(false);
              logIds.add(log._id.toString());

              // Verify required fields are present
              expect(log.organizationId).toBeInstanceOf(Types.ObjectId);
              expect(log.userId).toBeInstanceOf(Types.ObjectId);
              expect(log.action).toBeDefined();
              expect(log.resource).toBeDefined();
              expect(log.metadata).toBeDefined();
              expect(log.metadata.timestamp).toBeInstanceOf(Date);
              expect(typeof log.success).toBe('boolean');
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});