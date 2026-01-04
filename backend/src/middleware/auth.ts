import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// import { UserRole, VerificationStatus } from '@prisma/client'; // Removed Enums

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  role: string; // Was UserRole
  isVerified: boolean;
  verificationStatus: string; // Was VerificationStatus
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
    } catch (error) {
      // Token invalid, continue without user
    }
  }
  next();
}

// Require user to be verified (approved by coordinator)
export function requireVerified(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Teachers, coordinators, admins bypass verification check
  if (['teacher', 'coordinator', 'admin', 'superadmin'].includes(req.user.role)) {
    return next();
  }
  
  if (!req.user.isVerified || req.user.verificationStatus !== 'approved') {
    return res.status(403).json({ 
      error: 'Account verification required',
      verificationStatus: req.user.verificationStatus 
    });
  }
  next();
}

// Role-based access control
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required roles: ${roles.join(', ')}` });
    }
    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

export function requireTeacher(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || !['teacher', 'coordinator', 'admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Teacher access required' });
  }
  next();
}

export function requireCoordinator(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || !['coordinator', 'admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Coordinator access required' });
  }
  next();
}

export { JWT_SECRET };
