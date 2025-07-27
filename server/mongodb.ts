import mongoose from 'mongoose';

let MONGODB_URL = process.env.MONGODB_URL?.trim();

if (!MONGODB_URL) {
  throw new Error('MONGODB_URL environment variable is not defined');
}

// Clean up the URL by removing any leading/trailing parentheses or quotes
MONGODB_URL = MONGODB_URL.replace(/^[("']|[)"']$/g, '');

console.log('Connecting to MongoDB with URL:', MONGODB_URL ? 'URL found' : 'URL not found');

// MongoDB connection with proper error handling
export async function connectToMongoDB() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URL, {
      serverSelectionTimeoutMS: 30000, // 30 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
    });
    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't throw error, continue with PostgreSQL fallback
    console.log('Continuing without MongoDB...');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
  process.exit(0);
});

export { mongoose };