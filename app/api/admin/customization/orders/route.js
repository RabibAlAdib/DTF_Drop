import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import CustomOrder from "@/models/CustomOrder";
import { getAuth } from '@clerk/nextjs/server';
import authSeller from "@/lib/authSeller";

// GET - Fetch all custom orders (Admin only)
export async function GET(request) {
  try {
    await connectDB();
    
    // Authenticate and check seller role
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Authentication required"
      }, { status: 401 });
    }
    
    const isSellerAuth = await authSeller(request);
    if (!isSellerAuth) {
      return NextResponse.json({
        success: false,
        message: "Admin access required"
      }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const orders = await CustomOrder.find(query)
      .populate('templateId')
      .sort({ orderDate: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    
    const total = await CustomOrder.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get admin orders error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch orders"
    }, { status: 500 });
  }
}