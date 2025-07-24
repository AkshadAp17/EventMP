import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { setupAuth0 } from "./auth0";
import { insertEventSchema, insertBookingSchema } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify email connection
transporter.verify((error, success) => {
  if (error) {
    console.log('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Simple auth middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Check if Auth0 is configured
  const isAuth0Configured = !!(
    process.env.AUTH0_DOMAIN &&
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_CLIENT_SECRET &&
    process.env.AUTH0_BASE_URL
  );

  if (isAuth0Configured) {
    console.log('Setting up Auth0 authentication...');
    setupAuth0(app);
  } else {
    console.log('Auth0 not configured, using Replit authentication...');
    setupAuth(app);
    
    // Add fallback routes for Auth0 paths when Auth0 is not configured
    app.get('/auth/login', (req, res) => {
      res.redirect('/login');
    });
    
    app.get('/auth/logout', (req, res) => {
      res.redirect('/logout');
    });
  }

  // Create sample events on startup
  try {
    await storage.createSampleEvents();
    console.log("Sample events created successfully");
  } catch (error) {
    console.log("Sample events may already exist or database not ready");
  }

  // Auth routes - handle both Auth0 and local auth
  app.get('/api/user', (req: any, res, next) => {
    // If Auth0 is configured and user is authenticated via Auth0
    if (isAuth0Configured && req.oidc?.isAuthenticated()) {
      return next();
    }
    // Otherwise use local authentication
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  }, async (req: any, res) => {
    try {
      let user;
      
      // Handle Auth0 user
      if (isAuth0Configured && req.oidc?.isAuthenticated()) {
        const auth0User = req.oidc.user;
        user = await storage.getUserByEmail(auth0User.email);
        
        if (!user) {
          // Create new user from Auth0 profile
          user = await storage.createUser({
            email: auth0User.email,
            firstName: auth0User.given_name || auth0User.name?.split(' ')[0] || '',
            lastName: auth0User.family_name || auth0User.name?.split(' ').slice(1).join(' ') || '',
            profileImageUrl: auth0User.picture || null,
            isAdmin: false,
          });
        }
      } else {
        // Handle local user
        user = await storage.getUser(req.user.id);
      }
      
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

  // Email-based payment confirmation routes
  app.post("/api/payment/email-confirmation", isAuthenticated, async (req: any, res) => {
    try {
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await storage.getBooking(parseInt(bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Send email confirmation to user
      const emailSubject = `Payment Confirmation Required - ${booking.event.name}`;
      const emailContent = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B5CF6; text-align: center;">Payment Confirmation Required</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Event Details:</h3>
            <p><strong>Event:</strong> ${booking.event.name}</p>
            <p><strong>Date:</strong> ${new Date(booking.event.startDate).toLocaleDateString()}</p>
            <p><strong>Location:</strong> ${booking.event.location}</p>
            <p><strong>Quantity:</strong> ${booking.quantity} ticket(s)</p>
            <p><strong>Total Amount:</strong> $${booking.totalAmount}</p>
            <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
          </div>

          <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #dc2626; margin: 0;"><strong>Action Required:</strong></p>
            <p style="color: #dc2626; margin: 5px 0 0 0;">Please reply to this email with "PAYMENT CONFIRMED" to complete your booking.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280;">Thank you for choosing EventMaster!</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: booking.attendeeEmail,
        subject: emailSubject,
        html: emailContent,
      });

      res.json({ 
        message: "Payment confirmation email sent successfully",
        bookingReference: booking.bookingReference 
      });
    } catch (error) {
      console.error("Error sending payment confirmation email:", error);
      res.status(500).json({ message: "Failed to send payment confirmation email" });
    }
  });

  // Manual payment confirmation by admin
  app.post("/api/payment/confirm", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required" });
      }

      const booking = await storage.updateBookingStatus(
        parseInt(bookingId), 
        'confirmed',
        `manual_${Date.now()}`
      );

      // Send confirmation email to user
      const bookingDetails = await storage.getBooking(parseInt(bookingId));
      if (bookingDetails) {
        const confirmationEmail = `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981; text-align: center;">Booking Confirmed!</h2>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Event Details:</h3>
              <p><strong>Event:</strong> ${bookingDetails.event.name}</p>
              <p><strong>Date:</strong> ${new Date(bookingDetails.event.startDate).toLocaleDateString()}</p>
              <p><strong>Location:</strong> ${bookingDetails.event.location}</p>
              <p><strong>Quantity:</strong> ${bookingDetails.quantity} ticket(s)</p>
              <p><strong>Total Amount:</strong> $${bookingDetails.totalAmount}</p>
              <p><strong>Booking Reference:</strong> ${bookingDetails.bookingReference}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #10b981; font-weight: bold;">Your payment has been confirmed and your booking is now active!</p>
              <p style="color: #6b7280;">We look forward to seeing you at the event!</p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: bookingDetails.attendeeEmail,
          subject: `Booking Confirmed - ${bookingDetails.event.name}`,
          html: confirmationEmail,
        });
      }

      res.json({ 
        message: "Payment confirmed successfully",
        booking: booking 
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
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
