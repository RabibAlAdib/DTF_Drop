import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';
import Product from '@/models/Product';

await connectDB();

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User not authenticated"
      }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
    }

    // Get all favorite products
    const favoriteProducts = await Product.find({
      _id: { $in: user.favorites }
    });

    return NextResponse.json({
      success: true,
      products: favoriteProducts
    });

  } catch (error) {
    console.error('Get favorite products error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to get favorite products"
    }, { status: 500 });
  }
}