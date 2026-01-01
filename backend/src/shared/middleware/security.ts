import { Request, Response, NextFunction } from 'express';

const sanitizeString = (value: string): string => {
  const withoutScripts = value.replace(/<script.*?>[\s\S]*?<\/script>/gi, '');
  const withoutAngles = withoutScripts.replace(/[<>]/g, '');
  return withoutAngles.trim();
};

export const sanitizeValue = <T>(value: T): T => {
  if (typeof value === 'string') return sanitizeString(value) as unknown as T;
  if (Array.isArray(value)) return (value as unknown[]).map((item) => sanitizeValue(item)) as unknown as T;
  if (value && typeof value === 'object') {
    const sanitized = Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, val]) => {
      if (key === '__proto__') return acc; // prevent prototype pollution
      acc[key] = sanitizeValue(val);
      return acc;
    }, {});
    return sanitized as unknown as T;
  }
  return value;
};

export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction): void => {
  req.body = sanitizeValue(req.body);
  req.query = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);
  next();
};

export const enforceJsonContentType = (req: Request, res: Response, next: NextFunction): void => {
  const methodNeedsBody = ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase());
  if (methodNeedsBody) {
    const contentType = req.headers['content-type']?.toLowerCase();
    const isJson = contentType?.includes('application/json');
    const isMultipart = contentType?.includes('multipart/form-data');

    if (!contentType || (!isJson && !isMultipart)) {
      res.status(415).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Requests with a body must use application/json or multipart/form-data content type',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
      return;
    }
  }
  next();
};

const DEFAULT_SLOW_THRESHOLD_MS = 1000;

export const performanceMonitor = (thresholdMs = DEFAULT_SLOW_THRESHOLD_MS) => {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    const originalEnd = res.end;

    res.end = function (...args: unknown[]): Response {
      const duration = Date.now() - start;
      res.setHeader('X-Response-Time', `${duration}ms`);
      if (duration > thresholdMs) {
        // Surface slow responses via header; logging handled by requestLogger
        res.setHeader('X-Performance-Warning', 'slow-response');
      }
      return originalEnd.apply(this, args as Parameters<typeof originalEnd>);
    };

    next();
  };
};
