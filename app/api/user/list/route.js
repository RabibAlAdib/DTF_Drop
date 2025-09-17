import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/User';
import { isAdminUser } from '@/lib/authAdmin';

export async function GET(request) {
  try {
    // Check admin authorization
    if (!(await isAdminUser(request))) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

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