import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user';
import jwt from 'jsonwebtoken';
import { collections } from '../database';

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

interface JwtUserPayload extends jwt.JwtPayload {
  id: string;
  role: UserRole;
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

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Check if token is blacklisted
    const blacklistedToken = await collections.tokenBlacklist?.findOne({ token });
    if (blacklistedToken) {
      return res.status(401).json({ message: 'Token has been invalidated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as JwtUserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};