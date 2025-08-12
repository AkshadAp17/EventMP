import mongoose from 'mongoose';
import { connectToDatabase } from './mongodb';
import { 
  UserModel, 
  EventModel, 
  BookingModel, 
  NotificationModel, 
  ContactMessageModel,
  type User,
  type Event,
  type Booking,
  type Notification,
  type ContactMessage,
  type UpsertUser,
  type InsertEvent,
  type InsertBooking,
  type InsertNotification,
  type InsertContactMessage,
  type EventWithBookings,
  type BookingWithEvent
} from '@shared/mongodb-schema';
import type { IStorage } from './storage';

export class MongoStorage implements IStorage {
  constructor() {
    connectToDatabase();
  }

  // User operations  
  async getUser(id: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findById(id).exec();
      if (!user) return undefined;
      
      const userObj = user.toObject();
      return {
        id: userObj._id,
        email: userObj.email,
        username: userObj.username,
        password: userObj.password,
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        profileImageUrl: userObj.profileImageUrl,
        isAdmin: userObj.isAdmin,
        stripeCustomerId: userObj.stripeCustomerId,
        authProvider: userObj.authProvider,
        authProviderId: userObj.authProviderId,
        createdAt: userObj.createdAt,
        updatedAt: userObj.updatedAt,
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ email }).exec();
      return user ? { ...user.toObject(), id: user._id } : undefined;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const users = await UserModel.find().sort({ createdAt: -1 }).exec();
      return users.map(user => ({ ...user.toObject(), id: user._id }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async upsertUser(userData: Partial<UpsertUser> & { id: string }): Promise<User> {
    try {
      const updateData = {
        ...userData,
        updatedAt: new Date()
      };
      
      const user = await UserModel.findByIdAndUpdate(
        userData.id,
        updateData,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).exec();
      
      return { ...user!.toObject(), id: user!._id };
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }

  async createUser(userData: Partial<UpsertUser> & { email: string }): Promise<User> {
    try {
      const id = new mongoose.Types.ObjectId().toString();
      const user = new UserModel({
        _id: id,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await user.save();
      return { ...user.toObject(), id: user._id };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Event operations
  async createEvent(eventData: any): Promise<Event> {
    try {
      const id = new mongoose.Types.ObjectId().toString();
      const event = new EventModel({
        _id: id,
        ...eventData,
        organizerId: eventData.createdBy || eventData.organizerId,
        createdBy: eventData.createdBy || eventData.organizerId,
        currentAttendees: eventData.currentAttendees || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await event.save();
      return { ...event.toObject(), id: event._id };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async getEvents(filters?: { search?: string; category?: string; status?: string }): Promise<Event[]> {
    try {
      let query: any = {};
      
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
      
      const events = await EventModel.find(query).sort({ startDate: 1 }).exec();
      return events.map(event => {
        const eventObj = event.toObject();
        return {
          id: parseInt(eventObj._id) || eventObj._id,
          name: eventObj.name,
          description: eventObj.description,
          startDate: eventObj.startDate,
          endDate: eventObj.endDate,
          location: eventObj.location,
          ticketPrice: eventObj.ticketPrice,
          maxAttendees: eventObj.maxAttendees,
          currentAttendees: eventObj.currentAttendees,
          category: eventObj.category,
          status: eventObj.status,
          imageUrl: eventObj.imageUrl,
          createdBy: eventObj.createdBy || eventObj.organizerId,
          createdAt: eventObj.createdAt,
          updatedAt: eventObj.updatedAt,
        };
      });
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  async getEvent(id: number): Promise<any> {
    try {
      // Get all events and find the one that matches the numeric ID
      const events = await this.getEvents({});
      const event = events.find(e => e.id === id);
      
      if (!event) return undefined;
      
      // Get bookings for this event
      const bookings = await BookingModel.find({ 
        eventId: event.id.toString() 
      }).exec();
      
      return {
        ...event,
        bookings: bookings.map(booking => {
          const bookingObj = booking.toObject();
          return {
            id: parseInt(bookingObj._id) || bookingObj._id,
            eventId: parseInt(bookingObj.eventId) || bookingObj.eventId,
            userId: bookingObj.userId,
            quantity: bookingObj.quantity,
            totalAmount: bookingObj.totalAmount,
            status: bookingObj.status,
            stripePaymentIntentId: bookingObj.stripePaymentIntentId,
            bookingReference: bookingObj.bookingReference,
            attendeeEmail: bookingObj.attendeeEmail,
            attendeeName: bookingObj.attendeeName,
            createdAt: bookingObj.createdAt,
            updatedAt: bookingObj.updatedAt,
          };
        })
      };
    } catch (error) {
      console.error('Error getting event:', error);
      return undefined;
    }
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event> {
    try {
      const event = await EventModel.findByIdAndUpdate(
        id.toString(),
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).exec();
      
      if (!event) throw new Error('Event not found');
      return { ...event.toObject(), id: event._id };
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(id: number): Promise<void> {
    try {
      await EventModel.findByIdAndDelete(id.toString()).exec();
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async updateEventAttendeeCount(eventId: number): Promise<void> {
    try {
      console.log('🎫 Updating attendee count for event ID:', eventId);
      
      const confirmedBookings = await BookingModel.find({
        eventId: eventId.toString(),
        status: 'confirmed'
      }).exec();
      
      console.log('📊 Found confirmed bookings:', confirmedBookings.length, confirmedBookings.map(b => ({ id: b._id, quantity: b.quantity })));
      
      const totalAttendees = confirmedBookings.reduce((sum, booking) => {
        return sum + booking.quantity;
      }, 0);
      
      console.log('🔢 Total attendees calculated:', totalAttendees);
      
      // Update event directly by searching for the matching event ID
      const result = await EventModel.findByIdAndUpdate(
        eventId.toString(),
        { currentAttendees: totalAttendees },
        { new: true }
      ).exec();
      
      if (result) {
        console.log('✅ Event attendee count updated successfully:', {
          eventId: eventId,
          newAttendeeCount: totalAttendees,
          eventName: result.name
        });
      } else {
        console.error('❌ Event not found for attendee count update:', eventId);
      }
    } catch (error) {
      console.error('💥 Error updating event attendee count:', error);
    }
  }

  // Booking operations
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    try {
      const id = new mongoose.Types.ObjectId().toString();
      const booking = new BookingModel({
        _id: id,
        ...bookingData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await booking.save();
      
      // Always update event attendee count when booking is created
      console.log('About to update attendee count for eventId:', bookingData.eventId);
      await this.updateEventAttendeeCount(parseInt(bookingData.eventId));
      
      return { ...booking.toObject(), id: booking._id };
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  async getBookings(userId?: string, eventId?: number): Promise<BookingWithEvent[]> {
    try {
      let query: any = {};
      
      if (userId) query.userId = userId;
      if (eventId) query.eventId = eventId.toString();
      
      const bookings = await BookingModel.find(query).sort({ createdAt: -1 }).exec();
      
      // Get events for bookings
      const bookingsWithEvents: BookingWithEvent[] = [];
      for (const booking of bookings) {
        const event = await EventModel.findById(booking.eventId).exec();
        const user = await UserModel.findById(booking.userId).exec();
        
        bookingsWithEvents.push({
          ...booking.toObject(),
          id: booking._id,
          event: event ? { ...event.toObject(), id: event._id } : undefined,
          user: user ? { ...user.toObject(), id: user._id } : undefined
        });
      }
      
      return bookingsWithEvents;
    } catch (error) {
      console.error('Error getting bookings:', error);
      return [];
    }
  }

  async getBooking(id: string | number): Promise<BookingWithEvent | undefined> {
    try {
      // Handle both ObjectId strings and numeric IDs
      const booking = await BookingModel.findById(id.toString()).exec();
      if (!booking) return undefined;
      
      const event = await EventModel.findById(booking.eventId).exec();
      const user = await UserModel.findById(booking.userId).exec();
      
      return {
        ...booking.toObject(),
        id: booking._id,
        event: event ? { ...event.toObject(), id: event._id } : undefined,
        user: user ? { ...user.toObject(), id: user._id } : undefined
      };
    } catch (error) {
      console.error('Error getting booking:', error);
      return undefined;
    }
  }

  async getBookingByReference(reference: string): Promise<BookingWithEvent | undefined> {
    try {
      const booking = await BookingModel.findOne({ bookingReference: reference }).exec();
      if (!booking) return undefined;
      
      const event = await EventModel.findById(booking.eventId).exec();
      const user = await UserModel.findById(booking.userId).exec();
      
      return {
        ...booking.toObject(),
        id: booking._id,
        event: event ? { ...event.toObject(), id: event._id } : undefined,
        user: user ? { ...user.toObject(), id: user._id } : undefined
      };
    } catch (error) {
      console.error('Error getting booking by reference:', error);
      return undefined;
    }
  }

  async updateBookingStatus(id: number, status: string, paymentIntentId?: string): Promise<Booking> {
    try {
      const updateData: any = { status, updatedAt: new Date() };
      if (paymentIntentId) {
        updateData.stripePaymentIntentId = paymentIntentId;
      }
      
      const booking = await BookingModel.findByIdAndUpdate(
        id.toString(),
        updateData,
        { new: true }
      ).exec();
      
      if (!booking) throw new Error('Booking not found');
      
      // Update event attendee count
      await this.updateEventAttendeeCount(parseInt(booking.eventId));
      
      return { ...booking.toObject(), id: booking._id };
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  // Analytics
  async getDashboardStats(): Promise<{
    totalEvents: number;
    totalAttendees: number;
    totalRevenue: number;
    conversionRate: number;
  }> {
    try {
      const totalEvents = await EventModel.countDocuments({ status: { $ne: 'draft' } });
      
      const confirmedBookings = await BookingModel.find({ status: 'confirmed' }).exec();
      const totalAttendees = confirmedBookings.reduce((sum, booking) => sum + booking.quantity, 0);
      const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + parseFloat(booking.totalAmount), 0);
      
      const totalBookings = await BookingModel.countDocuments();
      const conversionRate = totalBookings > 0 ? (confirmedBookings.length / totalBookings) * 100 : 0;
      
      return {
        totalEvents,
        totalAttendees,
        totalRevenue,
        conversionRate: Math.round(conversionRate)
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return { totalEvents: 0, totalAttendees: 0, totalRevenue: 0, conversionRate: 0 };
    }
  }

  async getRevenueAnalytics(): Promise<any> {
    try {
      const bookings = await BookingModel.find({ status: 'confirmed' }).exec();
      // Implementation for revenue analytics
      return { data: [] };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      return { data: [] };
    }
  }

  async getAttendeeAnalytics(): Promise<any> {
    try {
      const bookings = await BookingModel.find({ status: 'confirmed' }).exec();
      // Implementation for attendee analytics
      return { data: [] };
    } catch (error) {
      console.error('Error getting attendee analytics:', error);
      return { data: [] };
    }
  }

  async getEventAnalytics(): Promise<any> {
    try {
      const events = await EventModel.find().exec();
      // Implementation for event analytics
      return { data: [] };
    } catch (error) {
      console.error('Error getting event analytics:', error);
      return { data: [] };
    }
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    try {
      const id = new mongoose.Types.ObjectId().toString();
      const notification = new NotificationModel({
        _id: id,
        ...notificationData,
        createdAt: new Date()
      });
      
      await notification.save();
      return { ...notification.toObject(), id: notification._id };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    try {
      const notifications = await NotificationModel.find({ userId })
        .sort({ createdAt: -1 })
        .exec();
      return notifications.map(notification => ({ ...notification.toObject(), id: notification._id }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(id: number, userId: string): Promise<Notification> {
    try {
      const notification = await NotificationModel.findOneAndUpdate(
        { _id: id.toString(), userId },
        { isRead: true },
        { new: true }
      ).exec();
      
      if (!notification) throw new Error('Notification not found');
      return { ...notification.toObject(), id: notification._id };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await NotificationModel.updateMany(
        { userId, isRead: false },
        { isRead: true }
      ).exec();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(id: number, userId: string): Promise<void> {
    try {
      await NotificationModel.findOneAndDelete({
        _id: id.toString(),
        userId
      }).exec();
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Contact message operations
  async createContactMessage(messageData: InsertContactMessage): Promise<ContactMessage> {
    try {
      const id = new mongoose.Types.ObjectId().toString();
      const message = new ContactMessageModel({
        _id: id,
        ...messageData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await message.save();
      return { ...message.toObject(), id: message._id };
    } catch (error) {
      console.error('Error creating contact message:', error);
      throw error;
    }
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    try {
      const messages = await ContactMessageModel.find()
        .sort({ createdAt: -1 })
        .exec();
      return messages.map(message => ({ ...message.toObject(), id: message._id }));
    } catch (error) {
      console.error('Error getting contact messages:', error);
      return [];
    }
  }

  async updateContactMessageStatus(id: number, status: string): Promise<ContactMessage> {
    try {
      const message = await ContactMessageModel.findByIdAndUpdate(
        id.toString(),
        { status, updatedAt: new Date() },
        { new: true }
      ).exec();
      
      if (!message) throw new Error('Contact message not found');
      return { ...message.toObject(), id: message._id };
    } catch (error) {
      console.error('Error updating contact message status:', error);
      throw error;
    }
  }

  // Sample data
  async createSampleEvents(): Promise<void> {
    try {
      // Check if events already exist
      const existingEvents = await EventModel.countDocuments();
      if (existingEvents > 0) {
        console.log('Sample events already exist, skipping creation');
        return;
      }

      // Create admin user
      const adminUserId = 'admin_sample_user';
      await this.upsertUser({
        id: adminUserId,
        email: 'admin@eventmaster.com',
        firstName: 'Event',
        lastName: 'Administrator',
        isAdmin: true,
        authProvider: 'local'
      });

      const sampleEvents = [
        {
          name: "AI & Machine Learning Conference 2025",
          description: "Join leading experts in artificial intelligence and machine learning for cutting-edge insights and networking opportunities.",
          category: "Technology",
          startDate: new Date('2025-09-15T09:00:00Z'),
          endDate: new Date('2025-09-15T17:00:00Z'),
          location: "San Francisco Convention Center",
          ticketPrice: "299.00",
          maxAttendees: 500,
          status: "active" as const,
          imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
          organizerId: adminUserId,
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
          status: "active" as const,
          imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800",
          organizerId: adminUserId,
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
          status: "upcoming" as const,
          imageUrl: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800",
          organizerId: adminUserId,
        },
      ];

      for (const event of sampleEvents) {
        await this.createEvent(event);
      }
      
      console.log('✅ Sample events created successfully');
    } catch (error) {
      console.error('Error creating sample events:', error);
    }
  }
}