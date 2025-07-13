import passport from "passport";
import { Strategy as Auth0Strategy } from "passport-auth0";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'default-dev-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development
      maxAge: sessionTtl,
      sameSite: 'lax',
    },
    name: 'eventmaster.sid',
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth0 Strategy
  console.log('Auth0 config check:', {
    domain: process.env.AUTH0_DOMAIN?.trim(),
    clientID: process.env.AUTH0_CLIENT_ID?.trim()?.substring(0, 10) + '...',
    hasSecret: !!process.env.AUTH0_CLIENT_SECRET?.trim(),
    callbackURL: `${process.env.AUTH0_BASE_URL}/api/auth/callback`
  });
  
  if (process.env.AUTH0_DOMAIN && process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET) {
    passport.use(
      new Auth0Strategy(
        {
          domain: process.env.AUTH0_DOMAIN.trim(),
          clientID: process.env.AUTH0_CLIENT_ID.trim(),
          clientSecret: process.env.AUTH0_CLIENT_SECRET.trim(),
          callbackURL: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
          scope: 'openid email profile',
        },
        async (accessToken, refreshToken, extraParams, profile, done) => {
          try {
            const user = await storage.upsertUser({
              id: profile.id,
              email: profile.emails?.[0]?.value || profile._json?.email,
              firstName: profile.name?.givenName || profile._json?.given_name,
              lastName: profile.name?.familyName || profile._json?.family_name,
              profileImageUrl: profile.photos?.[0]?.value || profile._json?.picture,
              authProvider: "auth0",
              authProviderId: profile.id,
            });
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  }

  // Local Strategy for fallback
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !user.password || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth0 routes
  app.get("/api/auth/login", passport.authenticate("auth0", {
    scope: "openid email profile"
  }));

  app.get("/api/auth/callback", 
    passport.authenticate("auth0", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  // Local auth routes
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, username } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        username,
        authProvider: "local",
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Create admin user if it doesn't exist
  initializeAdminUser();
}

async function initializeAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@eventmaster.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    if (!existingAdmin) {
      const hashedPassword = await hashPassword(adminPassword);
      await storage.createUser({
        email: adminEmail,
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        username: "admin",
        isAdmin: true,
        authProvider: "local",
      });
      console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}