import { NextResponse } from 'next/server'
import connectDB from '@/config/db';
import Product from "@/models/Product";

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params
    
    // Find product by ID using MongoDB query
    const product = await Product.findById(id).lean();
    
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      product
    })
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}