import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';

export async function GET() {
  try {
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