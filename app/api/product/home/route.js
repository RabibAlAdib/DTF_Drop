import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Product from '@/models/Product';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get only the first 20 products for home page with optimized query
    const products = await Product.find({})
      .sort({ date: -1 })
      .limit(20)
      .lean() // Use lean() for better performance
      .select('name price offerPrice images colorImages category date description gender designType colors sizes ratings numOfReviews variants numberofSales'); // Include all required fields for product display
    
    return NextResponse.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error fetching home products:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch home products' },
      { status: 500 }
    );
  }
}