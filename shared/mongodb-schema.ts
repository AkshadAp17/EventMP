import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// Zod validation schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  profileImageUrl: z.string().optional().nullable(),
  isAdmin: z.boolean().default(false),
  authProvider: z.string().default('local'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string(),
  ticketPrice: z.string(),
  maxAttendees: z.number(),
  currentAttendees: z.number().default(0),
  category: z.string(),
  status: z.enum(['draft', 'active', 'upcoming', 'completed']).default('active'),
  imageUrl: z.string().optional().nullable(),
  organizerId: z.string(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const BookingSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  userId: z.string(),
  quantity: z.number(),
  totalAmount: z.string(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).default('pending'),
  stripePaymentIntentId: z.string().optional().nullable(),
  bookingReference: z.string(),
  attendeeEmail: z.string().email(),
  attendeeName: z.string(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  isRead: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

export const ContactMessageSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  subject: z.string(),
  message: z.string(),
  status: z.enum(['new', 'read', 'responded']).default('new'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// MongoDB Mongoose Schemas
const userMongoSchema = new Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, default: null },
  password: { type: String, default: null },
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  profileImageUrl: { type: String, default: null },
  isAdmin: { type: Boolean, default: false },
  stripeCustomerId: { type: String, default: null },
  authProvider: { type: String, default: 'local' },
  authProviderId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const eventMongoSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String, required: true },
  ticketPrice: { type: String, required: true },
  maxAttendees: { type: Number, required: true },
  currentAttendees: { type: Number, default: 0 },
  category: { type: String, required: true },
  status: { type: String, enum: ['draft', 'active', 'upcoming', 'completed'], default: 'active' },
  imageUrl: { type: String, default: null },
  organizerId: { type: String, required: true },
  createdBy: { type: String, required: true }, // Add this field for compatibility
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const bookingMongoSchema = new Schema({
  _id: { type: String, required: true },
  eventId: { type: String, required: true },
  userId: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalAmount: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  stripePaymentIntentId: { type: String, default: null },
  bookingReference: { type: String, required: true, unique: true },
  attendeeEmail: { type: String, required: true },
  attendeeName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const notificationMongoSchema = new Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const contactMessageMongoSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'read', 'responded'], default: 'new' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Export Mongoose models
export const UserModel = mongoose.model('User', userMongoSchema);
export const EventModel = mongoose.model('Event', eventMongoSchema);
export const BookingModel = mongoose.model('Booking', bookingMongoSchema);
export const NotificationModel = mongoose.model('Notification', notificationMongoSchema);
export const ContactMessageModel = mongoose.model('ContactMessage', contactMessageMongoSchema);

// Type definitions
export type User = z.infer<typeof UserSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Booking = z.infer<typeof BookingSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type ContactMessage = z.infer<typeof ContactMessageSchema>;

// Insert types (without auto-generated fields)
export type UpsertUser = Omit<User, 'createdAt' | 'updatedAt'>;
export type InsertEvent = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertBooking = Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertNotification = Omit<Notification, 'id' | 'createdAt'>;
export type InsertContactMessage = Omit<ContactMessage, 'id' | 'createdAt' | 'updatedAt'>;

// Extended types for joins
export type EventWithBookings = Event & {
  bookings?: Booking[];
};

export type BookingWithEvent = Booking & {
  event?: Event;
  user?: User;
};