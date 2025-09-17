import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';
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
    
    const count = await Order.countDocuments();
    
    return NextResponse.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error counting orders:', error);
    return NextResponse.json({
      success: false,
      count: 0
    });
  }
}