import { logger } from '../config/logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode
    || (err.name === 'ValidationError' || err.name === 'ZodError' || err.name === 'MulterError' ? 400 : null)
    || (err.code === 'ER_DUP_ENTRY' || err.code === 23505 ? 409 : 500);
  const payload = {
    message: statusCode === 500 ? 'Internal server error' : err.message,
    details: err.details
  };

  if (statusCode === 500) {
    logger.error(err.message, { stack: err.stack });
  }

  res.status(statusCode).json(payload);
}
