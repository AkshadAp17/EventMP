import mongoose from 'mongoose';
import { storage as postgresStorage } from './storage';
import { 
  UserModel, 
  EventModel, 
  BookingModel, 
  NotificationModel, 
  ContactMessageModel 
} from '../shared/mongodb-schema';

let MONGODB_URL = process.env.MONGODB_URL?.trim();

if (!MONGODB_URL) {
  console.error('MONGODB_URL environment variable is required');
  process.exit(1);
}

// Clean up the URL by removing any leading/trailing parentheses or quotes
MONGODB_URL = MONGODB_URL.replace(/^[("']|[)"']$/g, '');

console.log('Cleaned MONGODB_URL:', MONGODB_URL.substring(0, 30) + '...');
console.log('MONGODB_URL starts with mongodb+srv://', MONGODB_URL.startsWith('mongodb+srv://'));

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URL, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

// Migration functions
async function migrateUsers() {
  console.log('🔄 Migrating users...');
  
  try {
    const users = await postgresStorage.getUsers();
    console.log(`Found ${users.length} users to migrate`);
    
    for (const user of users) {
      const existingUser = await UserModel.findById(user.id);
      if (!existingUser) {
        await UserModel.create({
          _id: user.id,
          email: user.email,
          username: user.username,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          isAdmin: user.isAdmin,
          authProvider: user.authProvider || 'local',
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
      }
    }
    
    const mongoUserCount = await UserModel.countDocuments();
    console.log(`✅ Users migration completed. MongoDB now has ${mongoUserCount} users`);
  } catch (error) {
    console.error('❌ User migration failed:', error);
    throw error;
  }
}

async function migrateEvents() {
  console.log('🔄 Migrating events...');
  
  try {
    const events = await postgresStorage.getEvents();
    console.log(`Found ${events.length} events to migrate`);
    
    for (const event of events) {
      const existingEvent = await EventModel.findById(event.id);
      if (!existingEvent) {
        await EventModel.create({
          _id: event.id.toString(),
          name: event.name,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          ticketPrice: event.ticketPrice,
          maxAttendees: event.maxAttendees,
          currentAttendees: event.currentAttendees,
          category: event.category,
          status: event.status,
          imageUrl: event.imageUrl,
          organizerId: event.organizerId || 'user_demo_1', // Default organizer for migration
          createdAt: event.createdAt,
          updatedAt: event.updatedAt,
        });
      }
    }
    
    const mongoEventCount = await EventModel.countDocuments();
    console.log(`✅ Events migration completed. MongoDB now has ${mongoEventCount} events`);
  } catch (error) {
    console.error('❌ Event migration failed:', error);
    throw error;
  }
}

async function migrateBookings() {
  console.log('🔄 Migrating bookings...');
  
  try {
    const bookings = await postgresStorage.getBookings();
    console.log(`Found ${bookings.length} bookings to migrate`);
    
    for (const booking of bookings) {
      const existingBooking = await BookingModel.findById(booking.id);
      if (!existingBooking) {
        await BookingModel.create({
          _id: booking.id.toString(),
          eventId: booking.eventId.toString(),
          userId: booking.userId,
          quantity: booking.quantity,
          totalAmount: booking.totalAmount,
          status: booking.status,
          stripePaymentIntentId: booking.stripePaymentIntentId,
          bookingReference: booking.bookingReference,
          attendeeEmail: booking.attendeeEmail,
          attendeeName: booking.attendeeName,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        });
      }
    }
    
    const mongoBookingCount = await BookingModel.countDocuments();
    console.log(`✅ Bookings migration completed. MongoDB now has ${mongoBookingCount} bookings`);
  } catch (error) {
    console.error('❌ Booking migration failed:', error);
    throw error;
  }
}

async function migrateContactMessages() {
  console.log('🔄 Migrating contact messages...');
  
  try {
    const messages = await postgresStorage.getContactMessages();
    console.log(`Found ${messages.length} contact messages to migrate`);
    
    for (const message of messages) {
      const existingMessage = await ContactMessageModel.findById(message.id);
      if (!existingMessage) {
        await ContactMessageModel.create({
          _id: message.id.toString(),
          name: message.name,
          email: message.email,
          subject: message.subject,
          message: message.message,
          status: message.status,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        });
      }
    }
    
    const mongoMessageCount = await ContactMessageModel.countDocuments();
    console.log(`✅ Contact messages migration completed. MongoDB now has ${mongoMessageCount} messages`);
  } catch (error) {
    console.error('❌ Contact message migration failed:', error);
    throw error;
  }
}

// Main migration function
export async function runMigration() {
  console.log('🚀 Starting MongoDB migration...');
  console.log(`📍 Target MongoDB URL: ${MONGODB_URL?.substring(0, 30)}...`);
  
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    // Run all migrations
    await migrateUsers();
    await migrateEvents();
    await migrateBookings();
    await migrateContactMessages();
    
    console.log('🎉 Migration completed successfully!');
    console.log('📊 Migration Summary:');
    console.log(`   Users: ${await UserModel.countDocuments()}`);
    console.log(`   Events: ${await EventModel.countDocuments()}`);
    console.log(`   Bookings: ${await BookingModel.countDocuments()}`);
    console.log(`   Contact Messages: ${await ContactMessageModel.countDocuments()}`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run migration if this script is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}