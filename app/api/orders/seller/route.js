import { NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/backend';
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

    // Check if user is admin first - admins bypass seller requirement
    const clerkClient = createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY 
    });
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.emailAddresses?.find(email => email.id === user.primaryEmailAddressId)?.emailAddress;
    const isAdmin = primaryEmail === 'dtfdrop25@gmail.com';
    
    // Only require seller role if not admin
    if (!isAdmin && !isSeller) {
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

    let query = {};
    let sellerProductIds = [];
    let sellerProductObjectIds = [];
    
    if (!isAdmin) {
      // For regular sellers, find only orders containing their products
      const sellerProducts = await Product.find({ userId: userId }).select('_id');
      sellerProductObjectIds = sellerProducts.map(product => product._id); // Keep as ObjectIds for query
      sellerProductIds = sellerProducts.map(product => product._id.toString()); // Strings for filtering
      
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
      
      query = {
        'items.productId': { $in: sellerProductObjectIds } // Use ObjectIds for DB query
      };
    }

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

    // Filter orders appropriately based on user role
    const filteredOrders = isAdmin ? orders : orders.map(order => {
      const sellerItems = order.items.filter(item => 
        sellerProductIds.includes(String(item.productId)) // Ensure string comparison
      );
      
      return {
        ...order,
        items: sellerItems,
        // Redact sensitive customer info for regular sellers
        customerInfo: {
          name: order.customerInfo?.name || 'Customer'
        },
        shippingAddress: {
          city: order.shippingAddress?.city
          // Hide full address for privacy
        }
      };
    });

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

// PUT /api/orders/seller - Update order status (admin/seller only)
export async function PUT(req) {
  try {
    // Use getSellerAuth to handle both cookie and Bearer token authentication
    const { userId, isSeller, error } = await getSellerAuth(req);
    
    if (!userId || error) {
      return NextResponse.json({ 
        success: false, 
        message: error || "Authentication required" 
      }, { status: 401 });
    }

    // Check if user is admin first - admins bypass seller requirement
    const clerkClient = createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY 
    });
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.emailAddresses?.find(email => email.id === user.primaryEmailAddressId)?.emailAddress;
    const isAdmin = primaryEmail === 'dtfdrop25@gmail.com';
    
    // Only require seller role if not admin
    if (!isAdmin && !isSeller) {
      return NextResponse.json({ 
        success: false, 
        message: "Only sellers are authorized for this action" 
      }, { status: 403 });
    }

    const { orderId, status } = await req.json();
    
    if (!orderId || !status) {
      return NextResponse.json({
        success: false,
        message: 'Order ID and status are required'
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      }, { status: 400 });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    // Check if seller owns products in this order (unless admin)
    if (!isAdmin) {
      const sellerProducts = await Product.find({ userId: userId }).select('_id');
      const sellerProductIds = sellerProducts.map(product => product._id.toString());
      
      const hasSellerProducts = order.items.some(item => 
        sellerProductIds.includes(String(item.productId))
      );
      
      if (!hasSellerProducts) {
        return NextResponse.json({
          success: false,
          message: 'You can only update orders containing your products'
        }, { status: 403 });
      }
    }

    // Update order status
    order.status = status;
    order.updatedAt = new Date();
    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update order status. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}