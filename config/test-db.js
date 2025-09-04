
import connectDB from './config/db.js';

async function testConnection() {
  try {
    await connectDB();
    console.log('✅ Database connected successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}


testConnection();
