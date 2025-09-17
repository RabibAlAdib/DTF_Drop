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
    
    const totalUsers = await User.countDocuments();
    const sellersCount = await User.countDocuments({ role: 'seller' });
    
    return NextResponse.json({
      success: true,
      count: totalUsers,
      sellersCount: sellersCount
    });
  } catch (error) {
    console.error('Error counting users:', error);
    return NextResponse.json({
      success: false,
      count: 0,
      sellersCount: 0
    });
  }
}