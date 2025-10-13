import mongoose from 'mongoose';

const connection: { isConnected?: number } = {};

async function dbConnect() {
  // Check if we have a connection to the database
  if (connection.isConnected === 1) {
    console.log('Using existing database connection');
    return;
  }

  try {
    console.log('Connecting to database...');

    // Check if MongoDB URI is available
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const db = await mongoose.connect(process.env.MONGODB_URI);

    connection.isConnected = db.connection.readyState;
    console.log('✅ Database connected successfully');
    console.log(`Connection state: ${connection.isConnected}`);
    console.log(`Database name: ${db.connection.name}`);
    console.log(`Host: ${db.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    connection.isConnected = 0;
    throw error;
  }
}

export default dbConnect;
