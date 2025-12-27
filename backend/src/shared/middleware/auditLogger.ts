import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AuditAction } from '@/shared/types/common';
import { logger } from '@/shared/utils/logger';

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  _id?: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  action: AuditAction;
  resource: string;
  resourceId?: Types.ObjectId;
  changes?: {
    before?: unknown;
    after?: unknown;
    fields?: string[];
  };
  metadata: {
    ipAddress: string;
    userAgent: string;
    requestId: string;
    timestamp: Date;
    method: string;
    url: string;
    statusCode?: number;
    duration?: number;
  };
  success: boolean;
  errorMessage?: string;
}

/**
 * In-memory audit log storage (in production, this would be a database)
 */
class AuditLogStore {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 10000; // Maximum number of logs to keep in memory

  /**
   * Add audit log entry
   */
  add(entry: AuditLogEntry): void {
    // Create a deep copy to ensure immutability
    const immutableEntry: AuditLogEntry = {
      _id: new Types.ObjectId(),
      organizationId: new Types.ObjectId(entry.organizationId.toString()),
      userId: new Types.ObjectId(entry.userId.toString()),
      action: entry.action,
      resource: entry.resource,
      ...(entry.resourceId && { resourceId: new Types.ObjectId(entry.resourceId.toString()) }),
      ...(entry.changes && { 
        changes: {
          ...(entry.changes.before !== undefined && { before: JSON.parse(JSON.stringify(entry.changes.before)) }),
          ...(entry.changes.after !== undefined && { after: JSON.parse(JSON.stringify(entry.changes.after)) }),
          ...(entry.changes.fields && { fields: [...entry.changes.fields] }),
        }
      }),
      metadata: {
        ipAddress: entry.metadata.ipAddress,
        userAgent: entry.metadata.userAgent,
        requestId: entry.metadata.requestId,
        timestamp: new Date(entry.metadata.timestamp.getTime()),
        method: entry.metadata.method,
        url: entry.metadata.url,
        ...(entry.metadata.statusCode !== undefined && { statusCode: entry.metadata.statusCode }),
        ...(entry.metadata.duration !== undefined && { duration: entry.metadata.duration }),
      },
      success: entry.success,
      ...(entry.errorMessage && { errorMessage: entry.errorMessage }),
    };
    
    this.logs.push(immutableEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    logger.info('Audit log entry created', {
      auditId: immutableEntry._id!.toString(),
      userId: immutableEntry.userId.toString(),
      organizationId: immutableEntry.organizationId.toString(),
      action: immutableEntry.action,
      resource: immutableEntry.resource,
      resourceId: immutableEntry.resourceId?.toString(),
      success: immutableEntry.success,
      requestId: immutableEntry.metadata.requestId,
    });
  }

  /**
   * Create a deep copy of an audit log entry to ensure immutability
   */
  private copyEntry(entry: AuditLogEntry): AuditLogEntry {
    const copy: AuditLogEntry = {
      organizationId: new Types.ObjectId(entry.organizationId.toString()),
      userId: new Types.ObjectId(entry.userId.toString()),
      action: entry.action,
      resource: entry.resource,
      ...(entry.resourceId && { resourceId: new Types.ObjectId(entry.resourceId.toString()) }),
      ...(entry.changes && { 
        changes: {
          ...(entry.changes.before !== undefined && { before: JSON.parse(JSON.stringify(entry.changes.before)) }),
          ...(entry.changes.after !== undefined && { after: JSON.parse(JSON.stringify(entry.changes.after)) }),
          ...(entry.changes.fields && { fields: [...entry.changes.fields] }),
        }
      }),
      metadata: {
        ipAddress: entry.metadata.ipAddress,
        userAgent: entry.metadata.userAgent,
        requestId: entry.metadata.requestId,
        timestamp: new Date(entry.metadata.timestamp.getTime()),
        method: entry.metadata.method,
        url: entry.metadata.url,
        ...(entry.metadata.statusCode !== undefined && { statusCode: entry.metadata.statusCode }),
        ...(entry.metadata.duration !== undefined && { duration: entry.metadata.duration }),
      },
      success: entry.success,
      ...(entry.errorMessage && { errorMessage: entry.errorMessage }),
    };
    
    // Add _id separately to handle optional property
    if (entry._id) {
      copy._id = new Types.ObjectId(entry._id.toString());
    }
    
    return copy;
  }

  /**
   * Get audit logs for an organization
   */
  getByOrganization(organizationId: Types.ObjectId, limit = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => log.organizationId.equals(organizationId))
      .slice(-limit)
      .reverse() // Most recent first
      .map(entry => this.copyEntry(entry));
  }

  /**
   * Get audit logs for a user
   */
  getByUser(userId: Types.ObjectId, limit = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => log.userId.equals(userId))
      .slice(-limit)
      .reverse() // Most recent first
      .map(entry => this.copyEntry(entry));
  }

  /**
   * Get audit logs for a resource
   */
  getByResource(resource: string, resourceId?: Types.ObjectId, limit = 100): AuditLogEntry[] {
    return this.logs
      .filter(log => {
        if (log.resource !== resource) return false;
        if (resourceId && (!log.resourceId || !log.resourceId.equals(resourceId))) return false;
        return true;
      })
      .slice(-limit)
      .reverse() // Most recent first
      .map(entry => this.copyEntry(entry));
  }

  /**
   * Get all audit logs (for super admin)
   */
  getAll(limit = 100): AuditLogEntry[] {
    return this.logs
      .slice(-limit)
      .reverse() // Most recent first
      .map(entry => this.copyEntry(entry));
  }

  /**
   * Get audit log statistics
   */
  getStats(): {
    totalLogs: number;
    logsByAction: Record<string, number>;
    logsByResource: Record<string, number>;
    recentActivity: number; // logs in last hour
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const logsByAction: Record<string, number> = {};
    const logsByResource: Record<string, number> = {};
    let recentActivity = 0;

    this.logs.forEach(log => {
      // Count by action
      logsByAction[log.action] = (logsByAction[log.action] || 0) + 1;
      
      // Count by resource
      logsByResource[log.resource] = (logsByResource[log.resource] || 0) + 1;
      
      // Count recent activity
      if (log.metadata.timestamp > oneHourAgo) {
        recentActivity++;
      }
    });

    return {
      totalLogs: this.logs.length,
      logsByAction,
      logsByResource,
      recentActivity,
    };
  }

  /**
   * Clear all logs (for testing)
   */
  clear(): void {
    this.logs = [];
    logger.info('Audit logs cleared');
  }
}

// Global audit log store instance
export const auditLogStore = new AuditLogStore();

/**
 * Middleware to capture audit trail for all user actions
 */
export const auditLogger = (options: {
  resource?: string;
  action?: AuditAction;
  getResourceId?: (req: Request) => Types.ObjectId | undefined;
  captureRequestBody?: boolean;
  captureResponseBody?: boolean;
} = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(); // Skip audit logging for unauthenticated requests
    }

    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseBody: unknown;
    let requestBody: unknown;

    // Capture request body if enabled
    if (options.captureRequestBody && req.body) {
      requestBody = sanitizeData(req.body);
    }

    // Override response methods to capture response body
    if (options.captureResponseBody) {
      res.send = function(body: unknown) {
        responseBody = sanitizeData(body);
        return originalSend.call(this, body);
      };

      res.json = function(body: unknown) {
        responseBody = sanitizeData(body);
        return originalJson.call(this, body);
      };
    }

    // Create audit log entry when response finishes
    res.on('finish', () => {
      try {
        const duration = Date.now() - startTime;
        const success = res.statusCode < 400;

        // Determine action from HTTP method if not specified
        const action = options.action || mapHttpMethodToAction(req.method);
        
        // Determine resource from URL if not specified
        const resource = options.resource || extractResourceFromUrl(req.url);
        
        // Get resource ID if available
        const resourceId = options.getResourceId ? options.getResourceId(req) : extractResourceIdFromParams(req);

        const changes = createChangesObject(requestBody, responseBody, req.method);
        
        const auditEntry: AuditLogEntry = {
          organizationId: req.user!.organizationId,
          userId: req.user!.userId,
          action,
          resource,
          ...(resourceId && { resourceId }),
          ...(changes && { changes }),
          metadata: {
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            requestId: req.requestId,
            timestamp: new Date(),
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
          },
          success,
          ...(success ? {} : { errorMessage: `HTTP ${res.statusCode}` }),
        };

        auditLogStore.add(auditEntry);
      } catch (error) {
        logger.error('Failed to create audit log entry', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: req.user?.userId.toString(),
          requestId: req.requestId,
        });
      }
    });

    next();
  };
};

/**
 * Middleware for specific audit actions
 */
export const auditAction = (action: AuditAction, resource: string, options: {
  getResourceId?: (req: Request) => Types.ObjectId | undefined;
  captureChanges?: boolean;
} = {}) => {
  return auditLogger({
    action,
    resource,
    ...(options.getResourceId && { getResourceId: options.getResourceId }),
    ...(options.captureChanges !== undefined && { captureRequestBody: options.captureChanges }),
    ...(options.captureChanges !== undefined && { captureResponseBody: options.captureChanges }),
  });
};

/**
 * Convenience middleware for common audit actions
 */
export const auditCreate = (resource: string, getResourceId?: (req: Request) => Types.ObjectId | undefined) =>
  auditAction(AuditAction.CREATE, resource, { 
    ...(getResourceId && { getResourceId }), 
    captureChanges: true 
  });

export const auditRead = (resource: string, getResourceId?: (req: Request) => Types.ObjectId | undefined) =>
  auditAction(AuditAction.READ, resource, { 
    ...(getResourceId && { getResourceId }) 
  });

export const auditUpdate = (resource: string, getResourceId?: (req: Request) => Types.ObjectId | undefined) =>
  auditAction(AuditAction.UPDATE, resource, { 
    ...(getResourceId && { getResourceId }), 
    captureChanges: true 
  });

export const auditDelete = (resource: string, getResourceId?: (req: Request) => Types.ObjectId | undefined) =>
  auditAction(AuditAction.DELETE, resource, { 
    ...(getResourceId && { getResourceId }), 
    captureChanges: true 
  });

export const auditLogin = () => auditAction(AuditAction.LOGIN, 'auth');
export const auditLogout = () => auditAction(AuditAction.LOGOUT, 'auth');
export const auditApprove = (resource: string, getResourceId?: (req: Request) => Types.ObjectId | undefined) =>
  auditAction(AuditAction.APPROVE, resource, { 
    ...(getResourceId && { getResourceId }), 
    captureChanges: true 
  });
export const auditReject = (resource: string, getResourceId?: (req: Request) => Types.ObjectId | undefined) =>
  auditAction(AuditAction.REJECT, resource, { 
    ...(getResourceId && { getResourceId }), 
    captureChanges: true 
  });

/**
 * Helper function to map HTTP methods to audit actions
 */
function mapHttpMethodToAction(method: string): AuditAction {
  switch (method.toUpperCase()) {
    case 'POST':
      return AuditAction.CREATE;
    case 'GET':
      return AuditAction.READ;
    case 'PUT':
    case 'PATCH':
      return AuditAction.UPDATE;
    case 'DELETE':
      return AuditAction.DELETE;
    default:
      return AuditAction.READ;
  }
}

/**
 * Helper function to extract resource name from URL
 */
function extractResourceFromUrl(url: string): string {
  // Remove query parameters
  const path = url.split('?')[0];
  
  if (!path) {
    return 'unknown';
  }
  
  // Extract resource from path like /api/employees/123 -> employees
  const segments = path.split('/').filter(segment => segment.length > 0);
  
  // Skip 'api' prefix if present
  const resourceIndex = segments[0] === 'api' ? 1 : 0;
  
  return segments[resourceIndex] || 'unknown';
}

/**
 * Helper function to extract resource ID from request parameters
 */
function extractResourceIdFromParams(req: Request): Types.ObjectId | undefined {
  // Try common parameter names
  const idParams = ['id', 'resourceId', 'employeeId', 'userId'];
  
  for (const param of idParams) {
    if (req.params[param]) {
      try {
        return new Types.ObjectId(req.params[param]);
      } catch {
        // Invalid ObjectId format, continue to next parameter
      }
    }
  }
  
  return undefined;
}

/**
 * Helper function to create changes object for audit log
 */
function createChangesObject(requestBody: unknown, responseBody: unknown, method: string): {
  before?: unknown;
  after?: unknown;
  fields?: string[];
} | undefined {
  if (!requestBody && !responseBody) {
    return undefined;
  }

  const changes: { before?: unknown; after?: unknown; fields?: string[] } = {};

  if (method === 'POST') {
    // For create operations, capture the created data
    changes.after = requestBody || responseBody;
  } else if (method === 'PUT' || method === 'PATCH') {
    // For update operations, capture the changes
    changes.after = requestBody;
    if (requestBody && typeof requestBody === 'object') {
      changes.fields = Object.keys(requestBody as Record<string, unknown>);
    }
  } else if (method === 'DELETE') {
    // For delete operations, capture what was deleted
    changes.before = responseBody;
  }

  return Object.keys(changes).length > 0 ? changes : undefined;
}

/**
 * Helper function to sanitize sensitive data from logs
 */
function sanitizeData(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized = { ...data as Record<string, unknown> };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}