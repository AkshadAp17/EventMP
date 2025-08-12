import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { authenticateUser, createUser, requireAuth, requireAdmin, type AuthUser } from "./auth-simple";
// Using in-memory storage with Zod validation
import { z } from "zod";
import { insertEventSchema, insertBookingSchema, insertContactMessageSchema } from "@shared/schema";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'akshadapastambh37@gmail.com',
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || 'urxpqhiqtjuhmcrs',
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

// Email helper functions
const sendBookingConfirmationEmail = async (booking: any, event: any) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'akshadapastambh37@gmail.com',
    to: booking.attendeeEmail,
    subject: `🎉 Booking Confirmed - ${event.name}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6; margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Your ticket has been successfully confirmed</p>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">Event Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0; color: #6b7280; font-weight: 500;">Event:</td><td style="padding: 5px 0; color: #374151; font-weight: 600;">${event.name}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280; font-weight: 500;">Date:</td><td style="padding: 5px 0; color: #374151;">${new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280; font-weight: 500;">Time:</td><td style="padding: 5px 0; color: #374151;">${new Date(event.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280; font-weight: 500;">Location:</td><td style="padding: 5px 0; color: #374151;">${event.location}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280; font-weight: 500;">Tickets:</td><td style="padding: 5px 0; color: #374151; font-weight: 600;">${booking.quantity} ticket(s)</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280; font-weight: 500;">Total Paid:</td><td style="padding: 5px 0; color: #10b981; font-weight: 700; font-size: 18px;">$${booking.totalAmount}</td></tr>
            </table>
          </div>

          <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="color: #059669; margin: 0; font-weight: 600;">Booking Reference: ${booking.bookingReference}</p>
            <p style="color: #059669; margin: 5px 0 0 0; font-size: 14px;">Please keep this reference number for your records</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Thank you for choosing EventMaster!</p>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">We look forward to seeing you at the event.</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent successfully to:', booking.attendeeEmail);
    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return false;
  }
};

const sendBookingCancellationEmail = async (booking: any, event: any) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'akshadapastambh37@gmail.com',
    to: booking.attendeeEmail,
    subject: `❌ Booking Cancelled - ${event.name}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 28px;">❌ Booking Cancelled</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">Your booking has been cancelled</p>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin: 0 0 15px 0;">Cancelled Booking Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 5px 0; color: #6b7280; font-weight: 500;">Event:</td><td style="padding: 5px 0; color: #374151; font-weight: 600;">${event.name}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280; font-weight: 500;">Date:</td><td style="padding: 5px 0; color: #374151;">${new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280; font-weight: 500;">Booking Reference:</td><td style="padding: 5px 0; color: #374151; font-weight: 600;">${booking.bookingReference}</td></tr>
              <tr><td style="padding: 5px 0; color: #6b7280; font-weight: 500;">Refund Amount:</td><td style="padding: 5px 0; color: #dc2626; font-weight: 700; font-size: 18px;">$${booking.totalAmount}</td></tr>
            </table>
          </div>

          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="color: #dc2626; margin: 0; font-weight: 600;">Refund Processing</p>
            <p style="color: #dc2626; margin: 5px 0 0 0; font-size: 14px;">Your refund will be processed within 3-5 business days</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">We're sorry to see you go!</p>
            <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Feel free to browse our other events at EventMaster.</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Booking cancellation email sent successfully to:', booking.attendeeEmail);
    return true;
  } catch (error) {
    console.error('Error sending booking cancellation email:', error);
    return false;
  }
};

// Use the simple auth middleware from auth-simple.ts

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('Using in-memory storage for clean Replit environment');
  console.log('Sample events and admin user loaded automatically');
  
  // Check if Auth0 is configured
  const isAuth0Configured = !!(
    process.env.AUTH0_DOMAIN &&
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_CLIENT_SECRET &&
    process.env.AUTH0_BASE_URL
  );

  // Remove Auth0 completely - use only simple authentication
  console.log('Using simple authentication system...');
  setupAuth(app);

  // Simple authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, username, name } = req.body;
      
      // Handle different form structures from both auth pages
      const fullName = name || `${firstName || ''} ${lastName || ''}`.trim() || username || email.split('@')[0];

      if (!email || !password || !fullName) {
        return res.status(400).json({ message: "Email, password, and name are required" });
      }

      // Check if user already exists 
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists. Please sign in instead." });
      }

      console.log('Creating user with:', { email, fullName });
      const user = await createUser(email, password, fullName);
      console.log('User created:', user);
      
      // Set up session
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin || false
      };
      
      const sessionUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin || false
      };
      
      res.status(201).json(sessionUser);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      console.log('Attempting login for:', email);

      // Check demo admin user first
      if (email === 'admin@eventmaster.com' && password === 'admin123') {
        const user = {
          id: 'admin-1',
          email: 'admin@eventmaster.com',
          name: 'Admin User',
          isAdmin: true
        };
        
        (req.session as any).user = user;
        console.log('Admin user logged in successfully');
        return res.json(user);
      }

      // Check database users
      try {
        const existingUser = await storage.getUserByEmail(email);
        console.log('Database user found:', !!existingUser);
        
        if (existingUser && (existingUser.password)) {
          const passwordToCheck = existingUser.password || '';
          console.log('User found with password field:', !!passwordToCheck);
          console.log('Password in DB looks like hash:', passwordToCheck.startsWith('$2'));
          
          let isValidPassword = false;
          
          // Check if password is hashed or plain text
          if (passwordToCheck.startsWith('$2')) {
            // Password is hashed with bcrypt
            isValidPassword = await bcrypt.compare(password, passwordToCheck);
          } else {
            // Password might be stored as plain text (legacy data)
            isValidPassword = password === passwordToCheck;
          }
          
          console.log('Password validation result:', isValidPassword);
          
          if (isValidPassword) {
            const user = {
              id: existingUser.id,
              email: existingUser.email,
              name: (existingUser as any).name || existingUser.email,
              isAdmin: existingUser.isAdmin || false
            };
            
            (req.session as any).user = user;
            console.log('Database user logged in successfully');
            return res.json(user);
          }
        }
      } catch (dbError) {
        console.error('Database authentication error:', dbError);
      }
      
      console.log('Authentication failed for:', email);
      return res.status(401).json({ message: "Invalid email or password" });
      
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    console.log('🚪 Auth logout request received, clearing session...');
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      console.log('✅ Auth session cleared successfully');
      res.json({ message: "Logged out successfully" });
    });
  });

  // Additional logout route for compatibility
  app.post('/api/logout', (req, res) => {
    console.log('🚪 General logout request received, clearing session...');
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      console.log('✅ General session cleared successfully');
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user route
  app.get('/api/user', requireAuth, (req: any, res) => {
    res.json(req.user);
  });

  // Create default admin and demo users on startup
  const createDefaultUsers = async () => {
    try {
      // Create admin user
      const adminEmail = 'akshadapastambh37@gmail.com';
      const adminUser = await storage.getUserByEmail(adminEmail);
      if (!adminUser) {
        await storage.createUser({
          email: adminEmail,
          firstName: 'Admin',
          lastName: 'User',
          isAdmin: true,
        });
        console.log('Admin user created successfully');
      }

      // Create demo user
      const demoEmail = process.env.DEMO_USER_EMAIL;
      if (demoEmail) {
        const demoUser = await storage.getUserByEmail(demoEmail);
        if (!demoUser) {
          await storage.createUser({
            email: demoEmail,
            firstName: 'Demo',
            lastName: 'User',
            isAdmin: false,
          });
          console.log('Demo user created successfully');
        }
      }
    } catch (error) {
      console.log('Error creating default users:', error);
    }
  };

  // Call function to create default users
  await createDefaultUsers();

  // Create sample events on startup
  try {
    await storage.createSampleEvents();
    console.log("Sample events created successfully");
  } catch (error) {
    console.log("Sample events may already exist or database not ready");
  }

  // Auth routes - handle both Auth0 and local auth
  app.get('/api/user', async (req: any, res) => {
    try {
      let user;
      
      // Check session-based authentication first
      const userId = (req.session as any)?.userId;
      if (userId) {
        user = (req.session as any).user;
        if (user) {
          return res.json(user);
        }
      }
      
      // If Auth0 is configured and user is authenticated via Auth0
      if (isAuth0Configured && req.oidc?.requireAuth()) {
        const auth0User = req.oidc.user;
        user = await storage.getUserByEmail(auth0User.email);
        
        if (!user) {
          user = await storage.createUser({
            email: auth0User.email,
            firstName: auth0User.given_name || auth0User.name?.split(' ')[0] || '',
            lastName: auth0User.family_name || auth0User.name?.split(' ').slice(1).join(' ') || '',
            profileImageUrl: auth0User.picture || null,
            isAdmin: false,
          });
        }
        return res.json(user);
      }
      
      // Check passport-based authentication
      if (req.requireAuth && req.requireAuth()) {
        user = await storage.getUser(req.user.id);
        return res.json(user);
      }
      
      // No valid authentication found
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Manual attendee count update route for debugging
  app.post('/api/events/:id/update-attendee-count', requireAuth, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      console.log('🔧 Manual attendee count update for event:', eventId);
      
      await storage.updateEventAttendeeCount(eventId);
      
      const updatedEvent = await storage.getEvent(eventId);
      console.log('📊 Updated event current attendees:', updatedEvent?.currentAttendees);
      
      res.json({ 
        success: true, 
        eventId, 
        currentAttendees: updatedEvent?.currentAttendees || 0,
        maxAttendees: updatedEvent?.maxAttendees || 0,
        message: 'Attendee count updated successfully' 
      });
    } catch (error) {
      console.error('Error in manual attendee count update:', error);
      res.status(500).json({ message: 'Failed to update attendee count' });
    }
  });

  // Bulk update all event attendee counts
  app.post('/api/events/update-all-attendee-counts', requireAuth, async (req: any, res) => {
    try {
      console.log('🔄 Bulk updating all event attendee counts...');
      const events = await storage.getEvents({});
      const results = [];
      
      for (const event of events) {
        await storage.updateEventAttendeeCount(event.id);
        const updatedEvent = await storage.getEvent(event.id);
        results.push({
          eventId: event.id,
          name: event.name,
          currentAttendees: updatedEvent?.currentAttendees || 0,
          maxAttendees: updatedEvent?.maxAttendees || 0
        });
      }
      
      res.json({ 
        success: true, 
        message: 'All event attendee counts updated',
        results 
      });
    } catch (error) {
      console.error('Error in bulk attendee count update:', error);
      res.status(500).json({ message: 'Failed to update attendee counts' });
    }
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const { search, category, status } = req.query;
      
      // Check if user is admin via session or passport
      const userId = (req.session as any)?.userId;
      let isAdmin = false;
      
      if (userId) {
        const sessionUser = (req.session as any)?.user;
        isAdmin = sessionUser?.isAdmin || false;
      } else if (req.user) {
        isAdmin = req.user.isAdmin || false;
      }
      
      // Show all events to regular users, admins can filter by status
      let finalStatus = status as string;
      // Remove automatic filtering so all events show by default
      
      const events = await storage.getEvents({
        search: search as string,
        category: category as string,
        status: finalStatus,
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      console.log('Looking for event with ID:', req.params.id);
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      const event = await storage.getEvent(eventId);
      console.log('Event found:', event ? 'YES' : 'NO');
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', requireAuth, async (req: any, res) => {
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

  app.put('/api/events/:id', requireAuth, async (req: any, res) => {
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

  app.delete('/api/events/:id', requireAuth, async (req: any, res) => {
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
  app.get('/api/bookings', requireAuth, async (req: any, res) => {
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

  // Get single booking by ID
  app.get('/api/bookings/:id', requireAuth, async (req: any, res) => {
    try {
      const bookingId = req.params.id;
      console.log('Looking for booking with ID:', bookingId);

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        console.log('Booking not found:', bookingId);
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if user can access this booking
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Admin can see any booking, users can only see their own
      if (!user?.isAdmin && booking.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log('Booking found and authorized:', booking.bookingReference);
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post('/api/bookings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate booking reference
      const bookingReference = `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Get event to calculate total amount
      const event = await storage.getEvent(parseInt(req.body.eventId));
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const quantity = req.body.quantity || 1;
      const totalAmount = (parseFloat(event.ticketPrice) * quantity).toFixed(2);

      const bookingData = {
        eventId: parseInt(req.body.eventId),
        userId,
        quantity,
        totalAmount,
        status: 'confirmed', // Auto-confirm since no payment processing
        stripePaymentIntentId: null, // No Stripe processing
        bookingReference,
        attendeeEmail: user.email || req.body.attendeeEmail,
        attendeeName: req.body.attendeeName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      };
      
      const booking = await storage.createBooking(bookingData);
      
      // Send email confirmation using event details already retrieved
      if (booking && event) {
        await sendBookingConfirmationEmail(booking, event);
      }
      
      // Force manual attendee count update with proper event ID conversion
      const eventIdForUpdate = parseInt(req.body.eventId);
      console.log('🔄 Forcing attendee count update after booking creation for event:', eventIdForUpdate);
      await storage.updateEventAttendeeCount(eventIdForUpdate);
      
      // Return booking with proper ID for frontend
      const bookingWithEvent = await storage.getBooking(booking.id);
      res.status(201).json(bookingWithEvent || booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Skip Stripe payment and create booking with email confirmation
  app.post("/api/payment/create-intent", requireAuth, async (req: any, res) => {
    try {
      // Since we're not using Stripe, we just return success
      res.json({ 
        success: true, 
        message: "Payment processing disabled - booking will be confirmed via email" 
      });
    } catch (error) {
      console.error("Error in payment endpoint:", error);
      res.status(500).json({ message: "Payment system unavailable" });
    }

  });

  // Manual payment confirmation by admin
  app.post("/api/payment/confirm", requireAuth, async (req: any, res) => {
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
      if (bookingDetails && bookingDetails.event) {
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

  // Contact form route
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      const contactData = { name, email, subject, message, status: 'new' };
      const contactMessage = await storage.createContactMessage(contactData);
      
      // Send notification email to admin
      const adminEmail = process.env.EMAIL_USER;
      const adminNotificationSubject = `New Contact Message from ${contactData.name}`;
      const adminNotificationContent = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B5CF6; text-align: center;">New Contact Message</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Contact Details:</h3>
            <p><strong>Name:</strong> ${contactData.name}</p>
            <p><strong>Email:</strong> ${contactData.email}</p>
            <p><strong>Subject:</strong> ${contactData.subject}</p>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${contactData.message}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #6b7280;">Reply directly to this email to respond to the user.</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: adminEmail,
        replyTo: contactData.email,
        subject: adminNotificationSubject,
        html: adminNotificationContent,
      });

      res.status(201).json({ message: "Contact message sent successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      }
      console.error("Error sending contact message:", error);
      res.status(500).json({ message: "Failed to send contact message" });
    }
  });

  // Notification routes
  app.get('/api/notifications', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Cancel booking route
  app.delete('/api/bookings/:id', requireAuth, async (req: any, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get booking details before deletion for email
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check authorization
      const user = await storage.getUser(userId);
      if (!user?.isAdmin && booking.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update booking status to cancelled
      await storage.updateBookingStatus(bookingId, 'cancelled');
      
      // Send cancellation email
      if (booking && booking.event) {
        await sendBookingCancellationEmail(booking, booking.event);
      }
      
      res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  app.patch('/api/notifications/:id/read', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id);
      
      const notification = await storage.markNotificationAsRead(notificationId, userId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/mark-all-read', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id);
      
      await storage.deleteNotification(notificationId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Users route - Admin only
  app.get('/api/users', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Tickets/Attendees routes - Admin only
  app.get('/api/tickets', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all bookings (tickets) with event and user information
      const tickets = await storage.getBookings();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  app.get('/api/attendees', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all confirmed bookings (attendees) with event and user information
      const attendees = await storage.getBookings();
      const confirmedAttendees = attendees.filter(booking => booking.status === 'confirmed');
      
      res.json(confirmedAttendees);
    } catch (error) {
      console.error("Error fetching attendees:", error);
      res.status(500).json({ message: "Failed to fetch attendees" });
    }
  });

  // Export routes - Admin only
  app.get('/api/export/tickets', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const tickets = await storage.getBookings();
      
      // Convert to CSV format
      const csvHeader = 'Booking ID,Event,Attendee Name,Email,Quantity,Amount,Status,Date\n';
      const csvData = tickets.map(ticket => [
        ticket.bookingReference,
        ticket.event?.name || 'Unknown',
        ticket.attendeeName,
        ticket.attendeeEmail,
        ticket.quantity,
        ticket.totalAmount,
        ticket.status,
        ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : ''
      ].join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="tickets-export.csv"');
      res.send(csvHeader + csvData);
    } catch (error) {
      console.error("Error exporting tickets:", error);
      res.status(500).json({ message: "Failed to export tickets" });
    }
  });

  app.get('/api/export/attendees', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const attendees = await storage.getBookings();
      const confirmedAttendees = attendees.filter(booking => booking.status === 'confirmed');
      
      // Convert to CSV format
      const csvHeader = 'Name,Email,Event,Tickets,Date,Amount\n';
      const csvData = confirmedAttendees.map(attendee => [
        attendee.attendeeName,
        attendee.attendeeEmail,
        attendee.event?.name || 'Unknown',
        attendee.quantity,
        attendee.createdAt ? new Date(attendee.createdAt).toLocaleDateString() : '',
        attendee.totalAmount
      ].join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendees-export.csv"');
      res.send(csvHeader + csvData);
    } catch (error) {
      console.error("Error exporting attendees:", error);
      res.status(500).json({ message: "Failed to export attendees" });
    }
  });

  // Bulk notification route - Admin only
  app.post('/api/notifications/bulk', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { title, message, eventId } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ message: "Title and message are required" });
      }

      // Get attendees for the event or all attendees if no eventId specified
      let attendees;
      if (eventId) {
        attendees = await storage.getBookings(undefined, parseInt(eventId));
      } else {
        attendees = await storage.getBookings();
      }

      const confirmedAttendees = attendees.filter(booking => booking.status === 'confirmed');
      
      // Create notifications for all attendees
      const notifications = [];
      for (const attendee of confirmedAttendees) {
        const notification = await storage.createNotification({
          userId: attendee.userId,
          type: 'admin_announcement',
          title: title,
          message: message,
          isRead: false
        });
        notifications.push(notification);

        // Send email notification
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: attendee.attendeeEmail,
            subject: title,
            html: `
              <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #8B5CF6; text-align: center;">${title}</h2>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="white-space: pre-wrap; color: #374151;">${message}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <p style="color: #6b7280;">Best regards,<br>EventMaster Team</p>
                </div>
              </div>
            `,
          });
        } catch (emailError) {
          console.error("Error sending email to", attendee.attendeeEmail, emailError);
        }
      }

      res.json({ 
        message: `Notifications sent to ${notifications.length} attendees`,
        count: notifications.length 
      });
    } catch (error) {
      console.error("Error sending bulk notifications:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  // Analytics routes - Admin only
  app.get('/api/analytics/revenue', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const revenueData = await storage.getRevenueAnalytics();
      res.json(revenueData);
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
  });

  app.get('/api/reports/generate', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Generate comprehensive report
      const [dashboardStats, revenueData, attendeeData, eventData] = await Promise.all([
        storage.getDashboardStats(),
        storage.getRevenueAnalytics(),
        storage.getAttendeeAnalytics(),
        storage.getEventAnalytics(),
      ]);

      const report = {
        generatedAt: new Date().toISOString(),
        summary: dashboardStats,
        revenue: revenueData,
        attendees: attendeeData,
        events: eventData,
      };

      res.json(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.get('/api/analytics/attendees', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const attendeeData = await storage.getAttendeeAnalytics();
      res.json(attendeeData);
    } catch (error) {
      console.error("Error fetching attendee analytics:", error);
      res.status(500).json({ message: "Failed to fetch attendee analytics" });
    }
  });

  app.get('/api/analytics/events', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const eventData = await storage.getEventAnalytics();
      res.json(eventData);
    } catch (error) {
      console.error("Error fetching event analytics:", error);
      res.status(500).json({ message: "Failed to fetch event analytics" });
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
