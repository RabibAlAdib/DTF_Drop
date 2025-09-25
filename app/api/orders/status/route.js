import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { sendOrderStatusUpdateEmail } from '@/lib/emailService';

await connectDB();

// PUT /api/orders/status - Update order status
export async function PUT(req) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const { orderId, status, note = '', trackingNumber = '' } = await req.json();
    
    // Validate input
    if (!orderId || !status) {
      return NextResponse.json({
        success: false,
        message: 'Order ID and status are required'
      }, { status: 400 });
    }

    const validStatuses = [
      'pending', 'confirmed', 'processing', 'ready_to_ship', 
      'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid order status'
      }, { status: 400 });
    }

    // Find the order
    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    // Check if user is authorized to update this order (seller or admin)
    const sellerProductIds = await Product.find({ userId }).select('_id');
    const isSellerForThisOrder = order.items.some(item => 
      sellerProductIds.some(product => product._id.toString() === item.productId)
    );
    
    if (!isSellerForThisOrder) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized to update this order status'
      }, { status: 403 });
    }

    // Validate status transition logic
    const currentStatus = order.status;
    const statusFlow = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['ready_to_ship', 'cancelled'],
      'ready_to_ship': ['shipped', 'cancelled'],
      'shipped': ['out_for_delivery', 'delivered'],
      'out_for_delivery': ['delivered', 'returned'],
      'delivered': ['returned'],
      'cancelled': [],
      'returned': []
    };

    if (!statusFlow[currentStatus]?.includes(status)) {
      return NextResponse.json({
        success: false,
        message: `Cannot change order status from "${currentStatus}" to "${status}"`
      }, { status: 400 });
    }

    // Update order status
    const updatedOrder = await order.updateStatus(status, note);

    // Add tracking number if provided
    if (trackingNumber && status === 'shipped') {
      updatedOrder.trackingNumber = trackingNumber;
      updatedOrder.shippedAt = new Date();
      await updatedOrder.save();
    }

    // Update delivery date estimates
    if (status === 'shipped') {
      const deliveryEstimate = new Date();
      deliveryEstimate.setDate(deliveryEstimate.getDate() + (order.delivery.isDhaka ? 2 : 4));
      updatedOrder.delivery.estimatedDeliveryDate = deliveryEstimate;
      await updatedOrder.save();
    }

    // Handle sales count updates based on status changes
    try {
      const { incrementSalesCount, decrementSalesCount } = await import('@/lib/salesService');
      
      // For COD orders: increment sales count when delivered
      if (status === 'delivered' && order.payment.method === 'cash_on_delivery') {
        await incrementSalesCount(order.items);
        console.log(`✅ Sales count incremented for COD order ${order.orderNumber} delivery`);
      }
      
      // For cancelled orders: decrement sales count if payment was completed
      if (status === 'cancelled') {
        if (order.payment.status === 'completed' || 
           (order.payment.method === 'cash_on_delivery' && currentStatus === 'delivered')) {
          await decrementSalesCount(order.items);
          console.log(`✅ Sales count decremented for cancelled order ${order.orderNumber}`);
        }
      }
      
      // For returned orders: decrement sales count
      if (status === 'returned') {
        await decrementSalesCount(order.items);
        console.log(`✅ Sales count decremented for returned order ${order.orderNumber}`);
      }
      
    } catch (salesError) {
      console.error('❌ Failed to update sales count for status change:', salesError);
      // Don't fail the status update if sales count update fails
    }

    // Send status update notification email
    try {
      await sendOrderStatusUpdateEmail(updatedOrder, status);
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Don't fail the status update if email fails
    }

    console.log(`Order ${order.orderNumber} status updated to "${status}" by seller ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: {
        _id: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        trackingNumber: updatedOrder.trackingNumber,
        estimatedDeliveryDate: updatedOrder.delivery.estimatedDeliveryDate,
        statusHistory: updatedOrder.statusHistory
      }
    });

  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update order status. Please try again.'
    }, { status: 500 });
  }
}

// GET /api/orders/status?orderId=123 - Get order status history
export async function GET(req) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'Order ID is required'
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

    // Check authorization (customer can view their orders, sellers can view orders for their products)
    const isCustomer = order.userId === userId;
    let isSeller = false;
    
    if (!isCustomer) {
      const sellerProductIds = await Product.find({ userId }).select('_id');
      isSeller = order.items.some(item => 
        sellerProductIds.some(product => product._id.toString() === item.productId)
      );
    }

    if (!isCustomer && !isSeller) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized access to order'
      }, { status: 403 });
    }

    // Return order status information
    const statusInfo = {
      currentStatus: order.status,
      statusHistory: order.statusHistory,
      trackingNumber: order.trackingNumber,
      estimatedDeliveryDate: order.delivery.estimatedDeliveryDate,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt
    };

    return NextResponse.json({
      success: true,
      statusInfo
    });

  } catch (error) {
    console.error('Order status get error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get order status'
    }, { status: 500 });
  }
}