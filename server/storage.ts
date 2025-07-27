import {
  users,
  events,
  bookings,
  notifications,
  contactMessages,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type Booking,
  type InsertBooking,
  type EventWithBookings,
  type BookingWithEvent,
  type Notification,
  type InsertNotification,
  type ContactMessage,
  type InsertContactMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sql, and, or, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (supports Auth0 and local auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  upsertUser(user: Partial<UpsertUser> & { id: string }): Promise<User>;
  createUser(user: Partial<UpsertUser> & { email: string }): Promise<User>;
  
  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  getEvents(filters?: { search?: string; category?: string; status?: string }): Promise<Event[]>;
  getEvent(id: number): Promise<EventWithBookings | undefined>;
  updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  updateEventAttendeeCount(eventId: number): Promise<void>;
  
  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookings(userId?: string, eventId?: number): Promise<BookingWithEvent[]>;
  getBooking(id: number): Promise<BookingWithEvent | undefined>;
  getBookingByReference(reference: string): Promise<BookingWithEvent | undefined>;
  updateBookingStatus(id: number, status: string, paymentIntentId?: string): Promise<Booking>;
  
  // Analytics
  getDashboardStats(): Promise<{
    totalEvents: number;
    totalAttendees: number;
    totalRevenue: number;
    conversionRate: number;
  }>;
  getRevenueAnalytics(): Promise<any>;
  getAttendeeAnalytics(): Promise<any>;
  getEventAnalytics(): Promise<any>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: number, userId: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: number, userId: string): Promise<void>;
  
  // Contact message operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  updateContactMessageStatus(id: number, status: string): Promise<ContactMessage>;
  
  // Sample data
  createSampleEvents(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async upsertUser(userData: Partial<UpsertUser> & { id: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email || '',
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        username: userData.username || null,
        password: userData.password || null,
        profileImageUrl: userData.profileImageUrl || null,
        isAdmin: userData.isAdmin || false,
        authProvider: userData.authProvider || 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email || users.email,
          firstName: userData.firstName || users.firstName,
          lastName: userData.lastName || users.lastName,
          username: userData.username || users.username,
          profileImageUrl: userData.profileImageUrl || users.profileImageUrl,
          isAdmin: userData.isAdmin || users.isAdmin,
          authProvider: userData.authProvider || users.authProvider,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: Partial<UpsertUser> & { email: string }): Promise<User> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [user] = await db
      .insert(users)
      .values({ ...userData, id })
      .returning();
    return user;
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<Event> {
    const [createdEvent] = await db.insert(events).values(event).returning();
    return createdEvent;
  }

  async getEvents(filters?: { search?: string; category?: string; status?: string }): Promise<Event[]> {
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(events.name, `%${filters.search}%`),
          ilike(events.description, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.category) {
      conditions.push(eq(events.category, filters.category));
    }
    
    if (filters?.status) {
      conditions.push(eq(events.status, filters.status));
    }
    
    if (conditions.length > 0) {
      return await db
        .select()
        .from(events)
        .where(and(...conditions))
        .orderBy(desc(events.createdAt));
    }
    
    return await db
      .select()
      .from(events)
      .orderBy(desc(events.createdAt));
  }

  async getEvent(id: number): Promise<EventWithBookings | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .leftJoin(bookings, eq(events.id, bookings.eventId))
      .leftJoin(users, eq(events.createdBy, users.id))
      .where(eq(events.id, id));
      
    if (!event.events) return undefined;
    
    const eventBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.eventId, id));
      
    return {
      ...event.events,
      bookings: eventBookings,
      creator: event.users!,
    };
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async updateEventAttendeeCount(eventId: number): Promise<void> {
    const [{ attendeeCount }] = await db
      .select({ attendeeCount: sql<number>`sum(${bookings.quantity})` })
      .from(bookings)
      .where(and(eq(bookings.eventId, eventId), eq(bookings.status, 'confirmed')));
      
    await db
      .update(events)
      .set({ currentAttendees: attendeeCount || 0 })
      .where(eq(events.id, eventId));
  }

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const bookingReference = this.generateBookingReference();
    const [createdBooking] = await db
      .insert(bookings)
      .values({ ...booking, bookingReference })
      .returning();
    return createdBooking;
  }

  async getBookings(userId?: string, eventId?: number): Promise<BookingWithEvent[]> {
    const conditions = [];
    if (userId) conditions.push(eq(bookings.userId, userId));
    if (eventId) conditions.push(eq(bookings.eventId, eventId));
    
    let results;
    if (conditions.length > 0) {
      results = await db
        .select()
        .from(bookings)
        .leftJoin(events, eq(bookings.eventId, events.id))
        .leftJoin(users, eq(bookings.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(bookings.createdAt));
    } else {
      results = await db
        .select()
        .from(bookings)
        .leftJoin(events, eq(bookings.eventId, events.id))
        .leftJoin(users, eq(bookings.userId, users.id))
        .orderBy(desc(bookings.createdAt));
    }
    
    return results.map(result => ({
      ...result.bookings!,
      event: result.events!,
      user: result.users!,
    }));
  }

  async getBooking(id: number): Promise<BookingWithEvent | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(events, eq(bookings.eventId, events.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.id, id));
      
    if (!result.bookings) return undefined;
    
    return {
      ...result.bookings,
      event: result.events!,
      user: result.users!,
    };
  }

  async getBookingByReference(reference: string): Promise<BookingWithEvent | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(events, eq(bookings.eventId, events.id))
      .leftJoin(users, eq(bookings.userId, users.id))
      .where(eq(bookings.bookingReference, reference));
      
    if (!result.bookings) return undefined;
    
    return {
      ...result.bookings,
      event: result.events!,
      user: result.users!,
    };
  }

  async updateBookingStatus(id: number, status: string, paymentIntentId?: string): Promise<Booking> {
    const updates: any = { status, updatedAt: new Date() };
    if (paymentIntentId) updates.stripePaymentIntentId = paymentIntentId;
    
    const [updatedBooking] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();
      
    // Update attendee count if booking is confirmed
    if (status === 'confirmed') {
      await this.updateEventAttendeeCount(updatedBooking.eventId);
    }
    
    return updatedBooking;
  }

  // Analytics
  async getDashboardStats() {
    const [eventStats] = await db
      .select({ count: count() })
      .from(events)
      .where(eq(events.status, 'active'));
      
    const [attendeeStats] = await db
      .select({ total: sql<number>`sum(${events.currentAttendees})` })
      .from(events);
      
    const [revenueStats] = await db
      .select({ total: sql<number>`sum(${bookings.totalAmount})` })
      .from(bookings)
      .where(eq(bookings.status, 'confirmed'));
      
    const [totalBookings] = await db.select({ count: count() }).from(bookings);
    const [confirmedBookings] = await db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.status, 'confirmed'));
      
    const conversionRate = totalBookings.count > 0 
      ? (confirmedBookings.count / totalBookings.count) * 100 
      : 0;

    return {
      totalEvents: eventStats.count,
      totalAttendees: attendeeStats.total || 0,
      totalRevenue: Number(revenueStats.total || 0),
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  }

  // Analytics methods
  async getRevenueAnalytics() {
    const revenueByMonth = await db
      .select({
        month: sql<string>`EXTRACT(MONTH FROM ${bookings.createdAt})`,
        year: sql<string>`EXTRACT(YEAR FROM ${bookings.createdAt})`,
        revenue: sql<number>`sum(${bookings.totalAmount})`,
      })
      .from(bookings)
      .where(eq(bookings.status, 'confirmed'))
      .groupBy(sql`EXTRACT(YEAR FROM ${bookings.createdAt}), EXTRACT(MONTH FROM ${bookings.createdAt})`)
      .orderBy(sql`EXTRACT(YEAR FROM ${bookings.createdAt}), EXTRACT(MONTH FROM ${bookings.createdAt})`);

    return revenueByMonth;
  }

  async getAttendeeAnalytics() {
    const attendeesByEvent = await db
      .select({
        eventName: events.name,
        attendees: sql<number>`sum(${bookings.quantity})`,
        revenue: sql<number>`sum(${bookings.totalAmount})`,
      })
      .from(bookings)
      .leftJoin(events, eq(bookings.eventId, events.id))
      .where(eq(bookings.status, 'confirmed'))
      .groupBy(events.id, events.name)
      .orderBy(sql`sum(${bookings.quantity}) DESC`);

    return attendeesByEvent;
  }

  async getEventAnalytics() {
    const eventsByCategory = await db
      .select({
        category: events.category,
        eventCount: count(),
        totalAttendees: sql<number>`sum(${events.currentAttendees})`,
      })
      .from(events)
      .groupBy(events.category)
      .orderBy(count());

    return eventsByCategory;
  }

  // Sample data
  async createSampleEvents(): Promise<void> {
    // Create sample admin user first
    const adminEmail = process.env.ADMIN_EMAIL;
    const demoEmail = process.env.DEMO_USER_EMAIL;
    
    let adminUser = null;
    let demoUser = null;
    
    if (adminEmail) {
      adminUser = await this.getUserByEmail(adminEmail);
      if (!adminUser) {
        adminUser = await this.createUser({
          email: adminEmail,
          firstName: 'Admin',
          lastName: 'User',
          isAdmin: true,
        });
      }
    }
    
    if (demoEmail) {
      demoUser = await this.getUserByEmail(demoEmail);
      if (!demoUser) {
        demoUser = await this.createUser({
          email: demoEmail,
          firstName: 'Demo',
          lastName: 'User',
          isAdmin: false,
        });
      }
    }

    const sampleEvents = [
      {
        name: "Tech Conference 2024",
        description: "Join industry leaders for cutting-edge tech insights and networking opportunities.",
        category: "conference",
        startDate: new Date("2024-03-15T09:00:00"),
        endDate: new Date("2024-03-15T18:00:00"),
        location: "San Francisco Convention Center",
        ticketPrice: "99.00",
        maxAttendees: 500,
        currentAttendees: 342,
        status: "active",
        imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        createdBy: adminUser?.id || "admin-user",
      },
      {
        name: "Summer Music Festival",
        description: "Three days of incredible music featuring top artists from around the world.",
        category: "festival",
        startDate: new Date("2024-06-20T14:00:00"),
        endDate: new Date("2024-06-22T23:00:00"),
        location: "Golden Gate Park",
        ticketPrice: "75.00",
        maxAttendees: 2000,
        currentAttendees: 1205,
        status: "upcoming",
        imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        createdBy: adminUser?.id || "admin-user",
      },
      {
        name: "Digital Marketing Workshop",
        description: "Learn the latest digital marketing strategies from industry experts.",
        category: "workshop",
        startDate: new Date("2024-04-08T10:00:00"),
        endDate: new Date("2024-04-08T16:00:00"),
        location: "WeWork Downtown",
        ticketPrice: "149.00",
        maxAttendees: 50,
        currentAttendees: 0,
        status: "draft",
        imageUrl: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        createdBy: adminUser?.id || "admin-user",
      },
      {
        name: "AI & Machine Learning Summit",
        description: "Deep dive into the latest AI technologies and machine learning frameworks.",
        category: "conference",
        startDate: new Date("2024-05-12T09:00:00"),
        endDate: new Date("2024-05-12T17:00:00"),
        location: "Silicon Valley Convention Center",
        ticketPrice: "179.00",
        maxAttendees: 300,
        currentAttendees: 245,
        status: "active",
        imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        createdBy: adminUser?.id || "admin-user",
      },
      {
        name: "Web Development Bootcamp",
        description: "Intensive hands-on workshop covering modern web development practices.",
        category: "workshop",
        startDate: new Date("2024-07-15T10:00:00"),
        endDate: new Date("2024-07-17T16:00:00"),
        location: "TechHub Downtown",
        ticketPrice: "299.00",
        maxAttendees: 80,
        currentAttendees: 67,
        status: "active",
        imageUrl: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250",
        createdBy: adminUser?.id || "admin-user",
      },
    ];

    // Insert events and create sample bookings
    for (const eventData of sampleEvents) {
      const [event] = await db.insert(events).values(eventData).onConflictDoNothing().returning();
      
      if (event && demoUser && (event.currentAttendees || 0) > 0) {
        // Create sample bookings for events with attendees
        const attendeeCount = event.currentAttendees || 0;
        const quantity = Math.min(2, attendeeCount);
        const sampleBookings = [
          {
            eventId: event.id,
            userId: demoUser.id,
            quantity: quantity,
            totalAmount: String(parseFloat(event.ticketPrice) * quantity),
            status: "confirmed" as const,
            attendeeEmail: demoUser.email,
            attendeeName: `${demoUser.firstName} ${demoUser.lastName}`,
          },
        ];

        for (const booking of sampleBookings) {
          await db.insert(bookings).values({
            ...booking,
            bookingReference: this.generateBookingReference(),
          }).onConflictDoNothing();
        }
      }
    }
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number, userId: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }

  async deleteNotification(id: number, userId: string): Promise<void> {
    await db
      .delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  // Contact message operations
  async createContactMessage(messageData: InsertContactMessage): Promise<ContactMessage> {
    const [message] = await db.insert(contactMessages).values(messageData).returning();
    return message;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }

  async updateContactMessageStatus(id: number, status: string): Promise<ContactMessage> {
    const [message] = await db
      .update(contactMessages)
      .set({ status, updatedAt: new Date() })
      .where(eq(contactMessages.id, id))
      .returning();
    return message;
  }

  private generateBookingReference(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}

export const storage = new DatabaseStorage();
