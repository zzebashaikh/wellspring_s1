// config/database.js
import mongoose from 'mongoose';
import { config } from './environment.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Continuing without MongoDB - using Firestore as primary database');
    console.log('🔧 To enable MongoDB:');
    console.log('   1. Install MongoDB: brew install mongodb-community');  
    console.log('   2. Start service: brew services start mongodb/brew/mongodb-community');
    console.log('   3. Restart this server');
  }
};
