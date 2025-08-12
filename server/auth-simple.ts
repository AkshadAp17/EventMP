import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

// Demo users for quick testing
const DEMO_USERS: Array<{
  id: string;
  email: string;
  password: string; // In real app, this would be hashed
  name: string;
  isAdmin: boolean;
}> = [
  {
    id: 'admin-1',
    email: 'admin@eventmaster.com',
    password: 'admin123',
    name: 'Admin User',
    isAdmin: true,
  },
  {
    id: 'user-1',  
    email: 'user@eventmaster.com',
    password: 'user123',
    name: 'Demo User',
    isAdmin: false,
  },
];

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  // Check demo users first
  const demoUser = DEMO_USERS.find(user => user.email === email);
  if (demoUser && demoUser.password === password) {
    return {
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      isAdmin: demoUser.isAdmin,
    };
  }

  // In real implementation, check database here
  // For now, return null for non-demo users
  return null;
}

export async function createUser(email: string, password: string, name: string): Promise<AuthUser> {
  // Hash the password
  const hashedPassword = await hashPassword(password);
  
  // In real implementation, save to database
  // For demo, create a temporary user object
  const newUser: AuthUser = {
    id: `user-${Date.now()}`,
    email,
    name,
    isAdmin: false,
  };
  
  return newUser;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req.session as any)?.user as AuthUser;
  
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  req.user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
}

declare module 'express-session' {
  interface SessionData {
    user?: AuthUser;
  }
}