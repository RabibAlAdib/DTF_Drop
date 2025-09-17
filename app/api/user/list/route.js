import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    
    const users = await User.find({})
      .select('username email role createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(100); // Limit to 100 users for performance
    
    return NextResponse.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      users: [],
      message: 'Failed to fetch users'
    });
  }
}