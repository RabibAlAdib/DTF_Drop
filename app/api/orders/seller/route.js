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

    // First, find all products owned by this seller
    const sellerProducts = await Product.find({ userId: userId }).select('_id');
    const sellerProductIds = sellerProducts.map(product => product._id.toString());

    if (sellerProductIds.length === 0) {
      return NextResponse.json({
        success: true,
        orders: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalOrders: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }

    // Build query to find orders containing seller's products
    let query = {
      'items.productId': { $in: sellerProductIds }
    };

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

    // Filter orders to only show items from this seller
    const filteredOrders = orders.map(order => {
      const sellerItems = order.items.filter(item => 
        sellerProductIds.includes(item.productId)
      );
      
      // Calculate seller's portion of the order total
      const sellerSubtotal = sellerItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const sellerTotal = sellerItems.length === order.items.length 
        ? order.pricing.totalAmount 
        : sellerSubtotal + (order.pricing.deliveryCharge * (sellerItems.length / order.items.length));

      return {
        ...order,
        items: sellerItems,
        pricing: {
          ...order.pricing,
          sellerSubtotal,
          sellerTotal: Math.round(sellerTotal)
        }
      };
    });

    // Format orders for response
    const formattedOrders = filteredOrders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerInfo: order.customerInfo,
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