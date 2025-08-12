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
  // Check demo users first for quick testing
  const demoUser = DEMO_USERS.find(user => user.email === email);
  if (demoUser && demoUser.password === password) {
    return {
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      isAdmin: demoUser.isAdmin,
    };
  }

  try {
    // Import storage to check database users
    const { storage } = await import('./storage');
    const user = await storage.getUserByEmail(email);
    
    if (user && user.password) {
      const isValidPassword = await comparePassword(password, user.password);
      if (isValidPassword) {
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User',
          isAdmin: user.isAdmin || false,
        };
      }
    }
  } catch (error) {
    console.error('Database authentication error:', error);
  }

  return null;
}

export async function createUser(email: string, password: string, name: string): Promise<AuthUser> {
  try {
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Save to database
    const { storage } = await import('./storage');
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(' ') || null;
    
    const userData = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      username: email.split('@')[0], // Use email prefix as username
      isAdmin: false,
    };
    
    const newUser = await storage.createUser(userData);
    
    return {
      id: newUser.id,
      email: newUser.email,
      name: `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || newUser.username || 'User',
      isAdmin: newUser.isAdmin || false,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user account');
  }
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