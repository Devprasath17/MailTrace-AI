import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]:', err?.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.isPublic ? err.message : 'An internal server error occurred while processing your request.';

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString()
  });
};
