import { NextResponse } from 'next/server';
import connectDB from '@/lib/connectDB';
import Order from '@/models/Order';
import { getAuth } from '@/lib/authUtil';

export async function GET(request) {
  try {
    // Get user authentication
    const authResult = await getAuth(request);
    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        message: authResult.message
      }, { status: 401 });
    }

    const { userId } = authResult;

    await connectDB();

    // Find orders for this user with pagination support
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean for better performance

    const totalOrders = await Order.countDocuments({ userId });

    return NextResponse.json({
      success: true,
      orders: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: skip + orders.length < totalOrders,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch orders'
    }, { status: 500 });
  }
}