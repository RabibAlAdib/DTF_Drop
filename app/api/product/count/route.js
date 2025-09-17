import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Product from '@/models/Product';

export async function GET() {
  try {
    await connectDB();
    
    const count = await Product.countDocuments();
    
    return NextResponse.json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Error counting products:', error);
    return NextResponse.json({
      success: false,
      count: 0
    });
  }
}