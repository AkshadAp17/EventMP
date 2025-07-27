import type { Express } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { storage } from "./storage";
import { setupAuth } from "./replitAuth";
import { setupAuth0 } from "./auth0";
import { insertEventSchema, insertBookingSchema, insertNotificationSchema, insertContactMessageSchema } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";

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

// Simple auth middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  // Check session-based authentication
  const userId = (req.session as any)?.userId;
  if (userId) {
    req.user = (req.session as any).user;
    return next();
  }
  
  // Check passport-based authentication
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
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

  // Local registration and login routes (for fallback when not using Replit auth)
  app.post('/api/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, username } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user with proper ID generation
      const user = await storage.createUser({
        email,
        firstName: firstName || username || email.split('@')[0],
        lastName: lastName || '',
        isAdmin: false,
        authProvider: "local",
      });

      // Set up session after registration
      (req.session as any).userId = user.id;
      (req.session as any).user = user;

      res.status(201).json(user);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check credentials against hardcoded admin and environment variables
      const adminEmail = 'akshadapastambh37@gmail.com';
      const adminPassword = 'Akshad@11';
      const demoEmail = process.env.DEMO_USER_EMAIL;
      const demoPassword = process.env.DEMO_USER_PASSWORD;

      let user = null;
      let isValidLogin = false;

      if (email === adminEmail && password === adminPassword) {
        // Get or create admin user
        user = await storage.getUserByEmail(email);
        if (!user) {
          user = await storage.createUser({
            email: adminEmail!,
            firstName: 'Admin',
            lastName: 'User',
            isAdmin: true,
          });
        }
        isValidLogin = true;
      } else if (email === demoEmail && password === demoPassword) {
        // Get or create demo user
        user = await storage.getUserByEmail(email);
        if (!user) {
          user = await storage.createUser({
            email: demoEmail!,
            firstName: 'Demo',
            lastName: 'User',
            isAdmin: false,
          });
        }
        isValidLogin = true;
      }

      if (!isValidLogin || !user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set up session after successful login
      (req.session as any).userId = user.id;
      (req.session as any).user = user;
      req.user = user; // Set user on request object for immediate use

      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/logout', (req, res) => {
    // Clear session
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });
    res.json({ message: "Logged out successfully" });
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
      if (isAuth0Configured && req.oidc?.isAuthenticated()) {
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
      if (req.isAuthenticated && req.isAuthenticated()) {
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
      
      // Check if user is admin via session or passport
      const userId = (req.session as any)?.userId;
      let isAdmin = false;
      
      if (userId) {
        const sessionUser = (req.session as any)?.user;
        isAdmin = sessionUser?.isAdmin || false;
      } else if (req.user) {
        isAdmin = req.user.isAdmin || false;
      }
      
      // For non-admin users, default to showing only active events
      let finalStatus = status as string;
      if (!isAdmin && !status) {
        finalStatus = 'active';
      }
      
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

  // Contact form route
  app.post('/api/contact', async (req, res) => {
    try {
      const contactData = insertContactMessageSchema.parse(req.body);
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
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
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

  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
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

  // Tickets/Attendees routes - Admin only
  app.get('/api/tickets', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/attendees', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/export/tickets', isAuthenticated, async (req: any, res) => {
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
        new Date(ticket.createdAt).toLocaleDateString()
      ].join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="tickets-export.csv"');
      res.send(csvHeader + csvData);
    } catch (error) {
      console.error("Error exporting tickets:", error);
      res.status(500).json({ message: "Failed to export tickets" });
    }
  });

  app.get('/api/export/attendees', isAuthenticated, async (req: any, res) => {
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
        new Date(attendee.createdAt).toLocaleDateString(),
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
  app.post('/api/notifications/bulk', isAuthenticated, async (req: any, res) => {
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
          metadata: eventId ? { eventId: parseInt(eventId) } : {},
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
  app.get('/api/analytics/revenue', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/reports/generate', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/analytics/attendees', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/analytics/events', isAuthenticated, async (req: any, res) => {
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
