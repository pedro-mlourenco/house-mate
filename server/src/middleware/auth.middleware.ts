import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        role: UserRole;
        id: string;
      };
    }
  }
}

export const checkRole = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userRole = req.user.role;
      if (!roles.includes(userRole)) {
        return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
      }

      next();
    };
};