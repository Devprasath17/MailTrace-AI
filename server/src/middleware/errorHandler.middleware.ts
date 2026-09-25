import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]:', err?.stack || err?.message || err);

  if (err?.code === 'LIMIT_FILE_SIZE' || err?.name === 'MulterError') {
    return res.status(400).json({
      error: 'Email file exceeds the maximum allowed size limit of 15MB.',
      timestamp: new Date().toISOString()
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An internal server error occurred while processing your request.';

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString()
  });
};
