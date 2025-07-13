import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertEventSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not found. Payment functionality will be limited.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Simple auth middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Create sample events on startup
  try {
    await storage.createSampleEvents();
    console.log("Sample events created successfully");
  } catch (error) {
    console.log("Sample events may already exist or database not ready");
  }

  // Auth routes
  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const { search, category, status } = req.query;
      
      // For non-admin users, default to showing only active events
      let defaultStatus = status as string;
      if (!req.user?.isAdmin && !status) {
        defaultStatus = 'active';
      }
      
      const events = await storage.getEvents({
        search: search as string,
        category: category as string,
        status: defaultStatus,
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Convert data types properly for validation
      const processedData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        ticketPrice: req.body.ticketPrice.toString(),
        maxAttendees: parseInt(req.body.maxAttendees.toString()),
        createdBy: req.user.id,
      };

      const eventData = insertEventSchema.parse(processedData);
      
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const eventId = parseInt(req.params.id);
      const updates = insertEventSchema.partial().parse(req.body);
      
      const event = await storage.updateEvent(eventId, updates);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const eventId = parseInt(req.params.id);
      await storage.deleteEvent(eventId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Booking routes
  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      let bookings;
      if (user?.isAdmin) {
        // Admin can see all bookings
        bookings = await storage.getBookings();
      } else {
        // Regular users can only see their own bookings
        bookings = await storage.getBookings(userId);
      }
      
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId,
        attendeeEmail: user.email || req.body.attendeeEmail,
        attendeeName: `${user.firstName} ${user.lastName}` || req.body.attendeeName,
      });
      
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing not available" });
    }

    try {
      const { amount, bookingId } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          bookingId: bookingId?.toString() || '',
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Webhook to handle payment confirmations
  app.post("/api/webhooks/stripe", async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing not available" });
    }

    try {
      const { type, data } = req.body;
      
      if (type === 'payment_intent.succeeded') {
        const paymentIntent = data.object;
        const bookingId = paymentIntent.metadata.bookingId;
        
        if (bookingId) {
          await storage.updateBookingStatus(
            parseInt(bookingId), 
            'confirmed', 
            paymentIntent.id
          );
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Error handling stripe webhook:", error);
      res.status(500).json({ message: "Webhook error" });
    }
  });

  // Auth0 authentication routes
  app.get('/api/auth/login', passport.authenticate('auth0', {
    scope: 'openid email profile'
  }));

  app.get('/api/auth/callback', 
    passport.authenticate('auth0', { failureRedirect: '/auth?error=auth_failed' }),
    (req, res) => {
      // Successful authentication, redirect to events page
      res.redirect('/events');
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
