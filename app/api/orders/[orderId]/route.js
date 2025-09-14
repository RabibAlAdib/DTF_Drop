import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';

// Connect to database
await connectDB();

// GET /api/orders/[orderId] - Get specific order by ID
export async function GET(req, { params }) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const { orderId } = params;
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'Order ID is required'
      }, { status: 400 });
    }

    // Find order by ID and ensure it belongs to the authenticated user
    const order = await Order.findOne({ 
      _id: orderId, 
      userId: userId 
    }).lean();

    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    // Format order for response
    const formattedOrder = {
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
        customization: item.customization,
        hasCustomization: item.customization.hasCustomDesign || 
                          item.customization.customText || 
                          item.customization.customNumber ||
                          item.customization.customSlogan ||
                          item.customization.specialInstructions
      })),
      pricing: order.pricing,
      delivery: order.delivery,
      payment: order.payment,
      giftInfo: order.giftInfo,
      statusHistory: order.statusHistory,
      adminNotes: order.adminNotes,
      priorityLevel: order.priorityLevel,
      totalItems: order.items.reduce((total, item) => total + item.quantity, 0),
      orderAge: Math.ceil((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24)),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder
    });

  } catch (error) {
    console.error('Get order by ID error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch order. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PATCH /api/orders/[orderId] - Update order status or details (for admin or customer updates)
export async function PATCH(req, { params }) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const { orderId } = params;
    const updateData = await req.json();
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        message: 'Order ID is required'
      }, { status: 400 });
    }

    // Find order by ID and ensure it belongs to the authenticated user
    const order = await Order.findOne({ 
      _id: orderId, 
      userId: userId 
    });

    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    // Handle different types of updates
    let updatedOrder;
    
    if (updateData.action === 'cancel' && order.status === 'pending') {
      // Allow customers to cancel pending orders
      updatedOrder = await order.updateStatus('cancelled', 'Order cancelled by customer');
    } else if (updateData.customerInfo) {
      // Allow customers to update their information for pending orders
      if (order.status === 'pending') {
        order.customerInfo = { ...order.customerInfo, ...updateData.customerInfo };
        updatedOrder = await order.save();
      } else {
        return NextResponse.json({
          success: false,
          message: 'Cannot update customer information for orders that are already being processed'
        }, { status: 400 });
      }
    } else if (updateData.deliveryNotes !== undefined) {
      // Allow customers to add/update delivery notes
      order.delivery.deliveryNotes = updateData.deliveryNotes;
      updatedOrder = await order.save();
    } else {
      return NextResponse.json({
        success: false,
        message: 'Invalid update action'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: {
        _id: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt
      }
    });

  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update order. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}