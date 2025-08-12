// Quick script to check and fix attendee counts manually
const { MongoClient } = require('mongodb');

async function fixAttendeeCount() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const events = await db.collection('events').find({}).toArray();
    const bookings = await db.collection('bookings').find({ status: 'confirmed' }).toArray();
    
    console.log('Found events:', events.length);
    console.log('Found confirmed bookings:', bookings.length);
    
    for (const event of events) {
      const eventBookings = bookings.filter(b => b.eventId === event._id.toString());
      const totalAttendees = eventBookings.reduce((sum, b) => sum + b.quantity, 0);
      
      console.log(`Event ${event._id}: ${eventBookings.length} bookings, ${totalAttendees} attendees`);
      
      await db.collection('events').updateOne(
        { _id: event._id },
        { $set: { currentAttendees: totalAttendees } }
      );
    }
    
    console.log('Attendee counts updated');
    
  } finally {
    await client.close();
  }
}

fixAttendeeCount().catch(console.error);