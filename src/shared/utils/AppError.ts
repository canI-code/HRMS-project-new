export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: unknown): AppError {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message: string, code = 'UNAUTHORIZED', details?: unknown): AppError {
    return new AppError(message, 401, code, details);
  }

  static forbidden(message: string, code = 'FORBIDDEN', details?: unknown): AppError {
    return new AppError(message, 403, code, details);
  }

  static notFound(message: string, code = 'NOT_FOUND', details?: unknown): AppError {
    return new AppError(message, 404, code, details);
  }

  static conflict(message: string, code = 'CONFLICT', details?: unknown): AppError {
    return new AppError(message, 409, code, details);
  }

  static unprocessableEntity(message: string, code = 'UNPROCESSABLE_ENTITY', details?: unknown): AppError {
    return new AppError(message, 422, code, details);
  }

  static internalServer(message: string, code = 'INTERNAL_SERVER_ERROR', details?: unknown): AppError {
    return new AppError(message, 500, code, details);
  }
}