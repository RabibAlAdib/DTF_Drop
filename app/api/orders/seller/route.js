import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { getSellerAuth } from '@/lib/authUtil';

// Connect to database
await connectDB();

// GET /api/orders/seller - Get orders for products owned by the seller
export async function GET(req) {
  try {
    // Use getSellerAuth to handle both cookie and Bearer token authentication
    const { userId, isSeller, error } = await getSellerAuth(req);
    
    if (!userId || error) {
      return NextResponse.json({ 
        success: false, 
        message: error || "Authentication required" 
      }, { status: 401 });
    }

    if (!isSeller) {
      return NextResponse.json({ 
        success: false, 
        message: "Only sellers are authorized for this action" 
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    // Build query to find ALL orders (as requested by user)
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    // Get orders with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    // Show all orders without filtering
    const filteredOrders = orders;

    // Format orders with complete information including addresses
    const formattedOrders = filteredOrders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerInfo: {
        name: order.customerInfo?.name,
        email: order.customerInfo?.email,
        phone: order.customerInfo?.phone
      },
      shippingAddress: {
        fullName: order.shippingAddress?.fullName,
        address: order.shippingAddress?.address,
        city: order.shippingAddress?.city,
        postalCode: order.shippingAddress?.postalCode,
        phone: order.shippingAddress?.phone
      },
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        productImage: item.productImage,
        hasCustomization: item.customization?.hasCustomDesign || 
                          item.customization?.customText || 
                          item.customization?.customNumber ||
                          item.customization?.customSlogan,
        customization: item.customization
      })),
      pricing: order.pricing,
      delivery: order.delivery,
      payment: order.payment,
      giftInfo: order.giftInfo,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get seller orders error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch orders. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}