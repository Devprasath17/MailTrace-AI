import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';

export const requireRoles = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    const userRole = req.user.role || 'VIEWER';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: `Permission denied. Required role: ${allowedRoles.join(' or ')}.` });
    }

    next();
  };
};
