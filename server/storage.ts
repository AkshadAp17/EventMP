import {
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

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private events = new Map<number, Event>();
  private bookings = new Map<number, Booking>();
  private notifications = new Map<number, Notification>();
  private contactMessages = new Map<number, ContactMessage>();
  private nextEventId = 1;
  private nextBookingId = 1;
  private nextNotificationId = 1;
  private nextContactMessageId = 1;

  constructor() {
    this.createSampleEvents();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async upsertUser(userData: Partial<UpsertUser> & { id: string }): Promise<User> {
    const now = new Date();
    const existingUser = this.users.get(userData.id);
    
    const user: User = {
      id: userData.id,
      email: userData.email || existingUser?.email || '',
      firstName: userData.firstName !== undefined ? userData.firstName : existingUser?.firstName || null,
      lastName: userData.lastName !== undefined ? userData.lastName : existingUser?.lastName || null,
      username: userData.username !== undefined ? userData.username : existingUser?.username || null,
      password: userData.password !== undefined ? userData.password : existingUser?.password || null,
      profileImageUrl: userData.profileImageUrl !== undefined ? userData.profileImageUrl : existingUser?.profileImageUrl || null,
      isAdmin: userData.isAdmin !== undefined ? userData.isAdmin : existingUser?.isAdmin || false,
      stripeCustomerId: existingUser?.stripeCustomerId || null,
      authProvider: userData.authProvider || existingUser?.authProvider || 'local',
      authProviderId: userData.authProviderId !== undefined ? userData.authProviderId : existingUser?.authProviderId || null,
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };
    
    this.users.set(userData.id, user);
    return user;
  }

  async createUser(userData: Partial<UpsertUser> & { email: string }): Promise<User> {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const user: User = {
      id,
      email: userData.email,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      username: userData.username || null,
      password: userData.password || null,
      profileImageUrl: userData.profileImageUrl || null,
      isAdmin: userData.isAdmin || false,
      stripeCustomerId: null,
      authProvider: userData.authProvider || 'local',
      authProviderId: userData.authProviderId || null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.users.set(id, user);
    return user;
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<Event> {
    const now = new Date();
    const newEvent: Event = {
      id: this.nextEventId++,
      name: event.name,
      description: event.description || null,
      category: event.category,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      ticketPrice: event.ticketPrice,
      maxAttendees: event.maxAttendees,
      currentAttendees: 0,
      status: event.status || 'draft',
      imageUrl: event.imageUrl || null,
      createdBy: event.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    
    this.events.set(newEvent.id, newEvent);
    return newEvent;
  }

  async getEvents(filters?: { search?: string; category?: string; status?: string }): Promise<Event[]> {
    let events = Array.from(this.events.values());
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      events = events.filter(event => 
        event.name.toLowerCase().includes(searchLower) ||
        (event.description && event.description.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters?.category) {
      events = events.filter(event => event.category === filters.category);
    }
    
    if (filters?.status) {
      events = events.filter(event => event.status === filters.status);
    }
    
    return events.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getEvent(id: number): Promise<EventWithBookings | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const eventBookings = Array.from(this.bookings.values()).filter(booking => booking.eventId === id);
    const creator = this.users.get(event.createdBy);
    
    return {
      ...event,
      bookings: eventBookings,
      creator: creator!,
    };
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event> {
    const event = this.events.get(id);
    if (!event) throw new Error('Event not found');
    
    const updatedEvent: Event = {
      ...event,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    this.events.delete(id);
    // Also delete related bookings
    Array.from(this.bookings.entries())
      .filter(([, booking]) => booking.eventId === id)
      .forEach(([bookingId]) => this.bookings.delete(bookingId));
  }

  async updateEventAttendeeCount(eventId: number): Promise<void> {
    const event = this.events.get(eventId);
    if (!event) return;
    
    const confirmedBookings = Array.from(this.bookings.values())
      .filter(booking => booking.eventId === eventId && booking.status === 'confirmed');
    
    const totalAttendees = confirmedBookings.reduce((sum, booking) => sum + booking.quantity, 0);
    
    this.events.set(eventId, {
      ...event,
      currentAttendees: totalAttendees,
      updatedAt: new Date(),
    });
  }

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const now = new Date();
    const reference = `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const newBooking: Booking = {
      id: this.nextBookingId++,
      eventId: booking.eventId,
      userId: booking.userId,
      quantity: booking.quantity,
      totalAmount: booking.totalAmount,
      status: booking.status || 'pending',
      stripePaymentIntentId: booking.stripePaymentIntentId || null,
      bookingReference: reference,
      attendeeEmail: booking.attendeeEmail,
      attendeeName: booking.attendeeName,
      createdAt: now,
      updatedAt: now,
    };
    
    this.bookings.set(newBooking.id, newBooking);
    return newBooking;
  }

  async getBookings(userId?: string, eventId?: number): Promise<BookingWithEvent[]> {
    let bookings = Array.from(this.bookings.values());
    
    if (userId) {
      bookings = bookings.filter(booking => booking.userId === userId);
    }
    
    if (eventId) {
      bookings = bookings.filter(booking => booking.eventId === eventId);
    }
    
    return bookings.map(booking => ({
      ...booking,
      event: this.events.get(booking.eventId)!,
      user: this.users.get(booking.userId)!,
    }));
  }

  async getBooking(id: number): Promise<BookingWithEvent | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    return {
      ...booking,
      event: this.events.get(booking.eventId)!,
      user: this.users.get(booking.userId)!,
    };
  }

  async getBookingByReference(reference: string): Promise<BookingWithEvent | undefined> {
    const booking = Array.from(this.bookings.values()).find(b => b.bookingReference === reference);
    if (!booking) return undefined;
    
    return {
      ...booking,
      event: this.events.get(booking.eventId)!,
      user: this.users.get(booking.userId)!,
    };
  }

  async updateBookingStatus(id: number, status: string, paymentIntentId?: string): Promise<Booking> {
    const booking = this.bookings.get(id);
    if (!booking) throw new Error('Booking not found');
    
    const updatedBooking: Booking = {
      ...booking,
      status,
      stripePaymentIntentId: paymentIntentId || booking.stripePaymentIntentId,
      updatedAt: new Date(),
    };
    
    this.bookings.set(id, updatedBooking);
    
    // Update event attendee count if booking is confirmed or cancelled
    if (status === 'confirmed' || status === 'cancelled') {
      await this.updateEventAttendeeCount(booking.eventId);
    }
    
    return updatedBooking;
  }

  // Analytics
  async getDashboardStats(): Promise<{
    totalEvents: number;
    totalAttendees: number;
    totalRevenue: number;
    conversionRate: number;
  }> {
    const totalEvents = this.events.size;
    const confirmedBookings = Array.from(this.bookings.values()).filter(b => b.status === 'confirmed');
    const totalAttendees = confirmedBookings.reduce((sum, booking) => sum + booking.quantity, 0);
    const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + parseFloat(booking.totalAmount), 0);
    const totalBookings = this.bookings.size;
    const conversionRate = totalBookings > 0 ? (confirmedBookings.length / totalBookings) * 100 : 0;
    
    return {
      totalEvents,
      totalAttendees,
      totalRevenue,
      conversionRate,
    };
  }

  async getRevenueAnalytics(): Promise<any> {
    // Simple analytics - could be expanded
    return [];
  }

  async getAttendeeAnalytics(): Promise<any> {
    return [];
  }

  async getEventAnalytics(): Promise<any> {
    return [];
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const now = new Date();
    const newNotification: Notification = {
      id: this.nextNotificationId++,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead || false,
      metadata: notification.metadata || null,
      createdAt: now,
    };
    
    this.notifications.set(newNotification.id, newNotification);
    return newNotification;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async markNotificationAsRead(id: number, userId: string): Promise<Notification> {
    const notification = this.notifications.get(id);
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    Array.from(this.notifications.entries())
      .filter(([, notification]) => notification.userId === userId && !notification.isRead)
      .forEach(([id, notification]) => {
        this.notifications.set(id, { ...notification, isRead: true });
      });
  }

  async deleteNotification(id: number, userId: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification && notification.userId === userId) {
      this.notifications.delete(id);
    }
  }

  // Contact message operations
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const now = new Date();
    const newMessage: ContactMessage = {
      id: this.nextContactMessageId++,
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
      status: message.status || 'new',
      createdAt: now,
      updatedAt: now,
    };
    
    this.contactMessages.set(newMessage.id, newMessage);
    return newMessage;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values())
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async updateContactMessageStatus(id: number, status: string): Promise<ContactMessage> {
    const message = this.contactMessages.get(id);
    if (!message) throw new Error('Contact message not found');
    
    const updatedMessage: ContactMessage = {
      ...message,
      status,
      updatedAt: new Date(),
    };
    
    this.contactMessages.set(id, updatedMessage);
    return updatedMessage;
  }

  // Sample data
  async createSampleEvents(): Promise<void> {
    // Create default admin user
    const adminUser: User = {
      id: 'admin_user',
      email: 'akshadapastambh37@gmail.com',
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      password: 'Akshad@11',
      profileImageUrl: null,
      isAdmin: true,
      stripeCustomerId: null,
      authProvider: 'local',
      authProviderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample events
    const sampleEvents = [
      {
        name: "AI Revolution Conference 2025",
        description: "Join industry leaders to explore the latest in artificial intelligence, machine learning, and the future of technology.",
        category: "Technology",
        startDate: new Date('2025-09-15T09:00:00Z'),
        endDate: new Date('2025-09-15T17:00:00Z'),
        location: "San Francisco Convention Center",
        ticketPrice: "299.00",
        maxAttendees: 500,
        status: "active",
        imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
        createdBy: adminUser.id,
      },
      {
        name: "Web Development Bootcamp",
        description: "Intensive workshop covering React, Node.js, and modern full-stack development practices.",
        category: "Technology",
        startDate: new Date('2025-08-20T10:00:00Z'),
        endDate: new Date('2025-08-22T16:00:00Z'),
        location: "Tech Hub Downtown",
        ticketPrice: "149.00",
        maxAttendees: 50,
        status: "active",
        imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
        createdBy: adminUser.id,
      },
      {
        name: "Mobile App Development Summit",
        description: "Learn the latest in iOS and Android development with hands-on workshops and expert speakers.",
        category: "Technology",
        startDate: new Date('2025-10-05T09:00:00Z'),
        endDate: new Date('2025-10-06T17:00:00Z'),
        location: "Innovation Center",
        ticketPrice: "199.00",
        maxAttendees: 200,
        status: "upcoming",
        imageUrl: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800",
        createdBy: adminUser.id,
      },
    ];

    for (const event of sampleEvents) {
      await this.createEvent(event);
    }
  }
}

// Create and export storage instance - using in-memory for now while fixing payment system
console.log('Using in-memory storage with Gmail confirmations only');
export const storage = new MemStorage();