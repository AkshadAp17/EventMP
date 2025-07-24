import { auth } from 'express-openid-connect';
import { Express } from 'express';
import { storage } from './storage';

declare global {
  namespace Express {
    interface Request {
      oidc: {
        isAuthenticated(): boolean;
        user?: any;
      };
    }
  }
}

export function setupAuth0(app: Express) {
  const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_CLIENT_SECRET || 'dev-secret-key',
    baseURL: process.env.AUTH0_BASE_URL || 'http://localhost:5000',
    clientID: process.env.AUTH0_CLIENT_ID || '',
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}` || '',
    routes: {
      login: '/auth/login',
      logout: '/auth/logout', 
      callback: '/auth/callback'
    }
  };

  console.log('Setting up Auth0 with config:', {
    baseURL: config.baseURL,
    clientID: config.clientID?.substring(0, 10) + '...',
    issuerBaseURL: config.issuerBaseURL,
    hasSecret: !!config.secret
  });

  // Apply Auth0 middleware
  app.use(auth(config));

  // Auth0 user profile endpoint
  app.get('/api/auth/profile', (req, res, next) => {
    if (!req.oidc.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
  }, async (req, res) => {
    try {
      const auth0User = req.oidc.user;
      
      if (!auth0User?.email) {
        return res.status(400).json({ error: 'No email found in Auth0 profile' });
      }

      // Check if user exists in our database
      let user = await storage.getUserByEmail(auth0User.email);
      
      if (!user) {
        // Create new user from Auth0 profile
        user = await storage.createUser({
          email: auth0User.email,
          firstName: auth0User.given_name || auth0User.name?.split(' ')[0] || '',
          lastName: auth0User.family_name || auth0User.name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: auth0User.picture || null,
          isAdmin: false,
        });
        console.log('Created new user from Auth0:', user.email);
      } else {
        // Update existing user with latest Auth0 info (skip for now as updateUser method needs to be implemented)
        console.log('Using existing user from Auth0:', user.email);
      }

      res.json(user!);
    } catch (error) {
      console.error('Auth0 profile error:', error);
      res.status(500).json({ error: 'Failed to process Auth0 profile' });
    }
  });

  // Check authentication status
  app.get('/api/auth/status', (req, res) => {
    res.json({
      isAuthenticated: req.oidc.isAuthenticated(),
      user: req.oidc.user || null
    });
  });
}