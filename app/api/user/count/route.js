import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/User';

export async function GET() {
  try {
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