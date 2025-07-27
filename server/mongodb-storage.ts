import {
  UserModel,
  EventModel,
  BookingModel,
  NotificationModel,
  ContactMessageModel,
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
} from "@shared/mongodb-schema";

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
  getEvent(id: string): Promise<EventWithBookings | undefined>;
  updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
  updateEventAttendeeCount(eventId: string): Promise<void>;
  
  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookings(userId?: string, eventId?: string): Promise<BookingWithEvent[]>;
  getBooking(id: string): Promise<BookingWithEvent | undefined>;
  getBookingByReference(reference: string): Promise<BookingWithEvent | undefined>;
  updateBookingStatus(id: string, status: string, paymentIntentId?: string): Promise<Booking>;
  
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
  markNotificationAsRead(id: string, userId: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(id: string, userId: string): Promise<void>;
  
  // Contact message operations
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  updateContactMessageStatus(id: string, status: string): Promise<ContactMessage>;
  
  // Sample data
  createSampleEvents(): Promise<void>;
}

export class MongoDBStorage implements IStorage {
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBookingReference(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id).exec();
    return user ? { ...user.toObject(), id: user._id } : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email }).exec();
    return user ? { ...user.toObject(), id: user._id } : undefined;
  }

  async getUsers(): Promise<User[]> {
    const users = await UserModel.find().sort({ createdAt: -1 }).exec();
    return users.map(user => ({ ...user.toObject(), id: user._id }));
  }

  async upsertUser(userData: Partial<UpsertUser> & { id: string }): Promise<User> {
    const user = await UserModel.findByIdAndUpdate(
      userData.id,
      {
        ...userData,
        _id: userData.id,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    ).exec();
    return { ...user.toObject(), id: user._id };
  }

  async createUser(userData: Partial<UpsertUser> & { email: string }): Promise<User> {
    const id = `user_${this.generateId()}`;
    const user = new UserModel({
      ...userData,
      _id: id,
    });
    await user.save();
    return { ...user.toObject(), id: user._id };
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = `event_${this.generateId()}`;
    const newEvent = new EventModel({
      ...event,
      _id: id,
    });
    await newEvent.save();
    return { ...newEvent.toObject(), id: newEvent._id };
  }

  async getEvents(filters?: { search?: string; category?: string; status?: string }): Promise<Event[]> {
    const query: any = {};
    
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    if (filters?.category) {
      query.category = filters.category;
    }
    
    if (filters?.status) {
      query.status = filters.status;
    }
    
    const events = await EventModel.find(query).sort({ createdAt: -1 }).exec();
    return events.map(event => ({ ...event.toObject(), id: event._id }));
  }

  async getEvent(id: string): Promise<EventWithBookings | undefined> {
    const event = await EventModel.findById(id).exec();
    if (!event) return undefined;

    const bookings = await BookingModel.find({ eventId: id }).exec();
    return {
      ...event.toObject(),
      id: event._id,
      bookings: bookings.map(booking => ({ ...booking.toObject(), id: booking._id }))
    };
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event> {
    const event = await EventModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    ).exec();
    if (!event) throw new Error('Event not found');
    return { ...event.toObject(), id: event._id };
  }

  async deleteEvent(id: string): Promise<void> {
    await EventModel.findByIdAndDelete(id).exec();
    // Also delete related bookings
    await BookingModel.deleteMany({ eventId: id }).exec();
  }

  async updateEventAttendeeCount(eventId: string): Promise<void> {
    const confirmedBookings = await BookingModel.find({ 
      eventId, 
      status: 'confirmed' 
    }).exec();
    
    const totalAttendees = confirmedBookings.reduce((sum, booking) => sum + booking.quantity, 0);
    
    await EventModel.findByIdAndUpdate(
      eventId,
      { currentAttendees: totalAttendees }
    ).exec();
  }

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = `booking_${this.generateId()}`;
    const newBooking = new BookingModel({
      ...booking,
      _id: id,
      bookingReference: booking.bookingReference || this.generateBookingReference(),
    });
    await newBooking.save();
    
    // Update event attendee count
    await this.updateEventAttendeeCount(booking.eventId);
    
    return { ...newBooking.toObject(), id: newBooking._id };
  }

  async getBookings(userId?: string, eventId?: string): Promise<BookingWithEvent[]> {
    const query: any = {};
    if (userId) query.userId = userId;
    if (eventId) query.eventId = eventId;
    
    const bookings = await BookingModel.find(query).sort({ createdAt: -1 }).exec();
    const bookingsWithEvents = [];
    
    for (const booking of bookings) {
      const event = await EventModel.findById(booking.eventId).exec();
      const user = await UserModel.findById(booking.userId).exec();
      
      bookingsWithEvents.push({
        ...booking.toObject(),
        id: booking._id,
        event: event ? { ...event.toObject(), id: event._id } : undefined,
        user: user ? { ...user.toObject(), id: user._id } : undefined,
      });
    }
    
    return bookingsWithEvents;
  }

  async getBooking(id: string): Promise<BookingWithEvent | undefined> {
    const booking = await BookingModel.findById(id).exec();
    if (!booking) return undefined;
    
    const event = await EventModel.findById(booking.eventId).exec();
    const user = await UserModel.findById(booking.userId).exec();
    
    return {
      ...booking.toObject(),
      id: booking._id,
      event: event ? { ...event.toObject(), id: event._id } : undefined,
      user: user ? { ...user.toObject(), id: user._id } : undefined,
    };
  }

  async getBookingByReference(reference: string): Promise<BookingWithEvent | undefined> {
    const booking = await BookingModel.findOne({ bookingReference: reference }).exec();
    if (!booking) return undefined;
    
    const event = await EventModel.findById(booking.eventId).exec();
    const user = await UserModel.findById(booking.userId).exec();
    
    return {
      ...booking.toObject(),
      id: booking._id,
      event: event ? { ...event.toObject(), id: event._id } : undefined,
      user: user ? { ...user.toObject(), id: user._id } : undefined,
    };
  }

  async updateBookingStatus(id: string, status: string, paymentIntentId?: string): Promise<Booking> {
    const updateData: any = { status, updatedAt: new Date() };
    if (paymentIntentId) updateData.stripePaymentIntentId = paymentIntentId;
    
    const booking = await BookingModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!booking) throw new Error('Booking not found');
    
    // Update event attendee count
    await this.updateEventAttendeeCount(booking.eventId);
    
    return { ...booking.toObject(), id: booking._id };
  }

  // Analytics
  async getDashboardStats(): Promise<{
    totalEvents: number;
    totalAttendees: number;
    totalRevenue: number;
    conversionRate: number;
  }> {
    const totalEvents = await EventModel.countDocuments().exec();
    
    const confirmedBookings = await BookingModel.find({ status: 'confirmed' }).exec();
    const totalAttendees = confirmedBookings.reduce((sum, booking) => sum + booking.quantity, 0);
    
    const totalRevenue = confirmedBookings.reduce((sum, booking) => 
      sum + parseFloat(booking.totalAmount), 0
    );
    
    const totalBookings = await BookingModel.countDocuments().exec();
    const conversionRate = totalBookings > 0 ? (confirmedBookings.length / totalBookings) * 100 : 0;
    
    return {
      totalEvents,
      totalAttendees,
      totalRevenue,
      conversionRate: Math.round(conversionRate),
    };
  }

  async getRevenueAnalytics(): Promise<any> {
    // Implementation for revenue analytics
    return [];
  }

  async getAttendeeAnalytics(): Promise<any> {
    // Implementation for attendee analytics
    return [];
  }

  async getEventAnalytics(): Promise<any> {
    // Implementation for event analytics
    return [];
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = `notification_${this.generateId()}`;
    const notification = new NotificationModel({
      ...notificationData,
      _id: id,
    });
    await notification.save();
    return { ...notification.toObject(), id: notification._id };
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return notifications.map(notification => ({ ...notification.toObject(), id: notification._id }));
  }

  async markNotificationAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    ).exec();
    if (!notification) throw new Error('Notification not found');
    return { ...notification.toObject(), id: notification._id };
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await NotificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true }
    ).exec();
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await NotificationModel.findOneAndDelete({ _id: id, userId }).exec();
  }

  // Contact message operations
  async createContactMessage(messageData: InsertContactMessage): Promise<ContactMessage> {
    const id = `contact_${this.generateId()}`;
    const message = new ContactMessageModel({
      ...messageData,
      _id: id,
    });
    await message.save();
    return { ...message.toObject(), id: message._id };
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    const messages = await ContactMessageModel.find().sort({ createdAt: -1 }).exec();
    return messages.map(message => ({ ...message.toObject(), id: message._id }));
  }

  async updateContactMessageStatus(id: string, status: string): Promise<ContactMessage> {
    const message = await ContactMessageModel.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    ).exec();
    if (!message) throw new Error('Contact message not found');
    return { ...message.toObject(), id: message._id };
  }

  // Sample data
  async createSampleEvents(): Promise<void> {
    // Check if we already have events
    const existingEvents = await EventModel.countDocuments().exec();
    if (existingEvents > 0) {
      console.log('Sample events already exist');
      return;
    }

    // Create demo user
    const demoUserId = 'user_demo_1';
    let demoUser = await UserModel.findById(demoUserId).exec();
    
    if (!demoUser) {
      demoUser = new UserModel({
        _id: demoUserId,
        email: 'demo@eventmaster.com',
        firstName: 'Demo',
        lastName: 'User',
        isAdmin: false,
        authProvider: 'local',
      });
      await demoUser.save();
    }

    // Sample events data
    const sampleEvents = [
      {
        name: "Web Development Bootcamp",
        description: "Intensive 3-day bootcamp covering HTML, CSS, JavaScript, React, and Node.js. Perfect for beginners looking to start their web development journey.",
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        location: "Tech Hub, San Francisco",
        ticketPrice: "299.00",
        maxAttendees: 50,
        currentAttendees: 23,
        category: "Technology",
        status: "active" as const,
        organizerId: demoUserId,
      },
      {
        name: "AI & Machine Learning Conference",
        description: "Join industry experts as they discuss the latest trends in AI and machine learning. Network with professionals and learn about cutting-edge technologies.",
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // same day
        location: "Convention Center, New York",
        ticketPrice: "149.00",
        maxAttendees: 200,
        currentAttendees: 67,
        category: "Technology",
        status: "active" as const,
        organizerId: demoUserId,
      },
      {
        name: "Mobile App Development Workshop",
        description: "Learn to build native mobile apps for iOS and Android using React Native. Hands-on workshop with real projects.",
        startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        endDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), // 22 days from now
        location: "Innovation Lab, Austin",
        ticketPrice: "199.00",
        maxAttendees: 30,
        currentAttendees: 18,
        category: "Technology",
        status: "active" as const,
        organizerId: demoUserId,
      },
      {
        name: "Cloud Computing Summit",
        description: "Explore the future of cloud computing with AWS, Azure, and Google Cloud Platform. Learn about serverless architecture and containerization.",
        startDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // same day
        location: "Seattle Conference Center",
        ticketPrice: "179.00",
        maxAttendees: 100,
        currentAttendees: 42,
        category: "Technology",
        status: "active" as const,
        organizerId: demoUserId,
      },
      {
        name: "Cybersecurity Essentials",
        description: "Essential cybersecurity training for developers and IT professionals. Learn about threat detection, prevention, and response strategies.",
        startDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
        endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // same day
        location: "Security Institute, Washington DC",
        ticketPrice: "249.00",
        maxAttendees: 75,
        currentAttendees: 31,
        category: "Technology",
        status: "active" as const,
        organizerId: demoUserId,
      },
    ];

    // Insert events and create sample bookings
    for (const eventData of sampleEvents) {
      const event = new EventModel({
        ...eventData,
        _id: `event_${this.generateId()}`,
      });
      await event.save();
      
      if (event && demoUser && (event.currentAttendees || 0) > 0) {
        // Create sample bookings for events with attendees
        const attendeeCount = event.currentAttendees || 0;
        const quantity = Math.min(2, attendeeCount);
        
        const booking = new BookingModel({
          _id: `booking_${this.generateId()}`,
          eventId: event._id,
          userId: demoUser._id,
          quantity: quantity,
          totalAmount: String(parseFloat(event.ticketPrice) * quantity),
          status: "confirmed" as const,
          attendeeEmail: demoUser.email,
          attendeeName: `${demoUser.firstName} ${demoUser.lastName}`,
          bookingReference: this.generateBookingReference(),
        });
        await booking.save();
      }
    }
    
    console.log('Sample events created successfully');
  }
}

export const storage = new MongoDBStorage();