import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();
  
  // Add request ID to headers for client reference
  res.setHeader('X-Request-ID', req.requestId);
  req.headers['x-request-id'] = req.requestId;

  // Log incoming request
  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args: unknown[]): Response {
    const duration = Date.now() - req.startTime;
    
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
    });

    return originalEnd.apply(this, args as Parameters<typeof originalEnd>);
  };

  next();
};