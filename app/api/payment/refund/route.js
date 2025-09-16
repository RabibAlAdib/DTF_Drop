import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import { PaymentService } from '@/lib/paymentService';

await connectDB();

// POST /api/payment/refund - Process a refund for an order
export async function POST(req) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const { orderId, reason = 'Customer requested refund' } = await req.json();
    
    // Validate input
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

    // Check if user is authorized (customer or admin)
    const isCustomer = order.userId === userId;
    const isAdmin = false; // Add admin check later
    
    if (!isCustomer && !isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized to process refund for this order'
      }, { status: 403 });
    }

    // Check if order is eligible for refund
    if (order.payment.status === 'refunded') {
      return NextResponse.json({
        success: false,
        message: 'Order has already been refunded'
      }, { status: 400 });
    }

    if (order.payment.status !== 'paid') {
      return NextResponse.json({
        success: false,
        message: 'Only paid orders can be refunded'
      }, { status: 400 });
    }

    // Check if order is too old for refund (optional business rule)
    const orderAge = Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24));
    const maxRefundDays = 30; // 30 days refund policy
    
    if (orderAge > maxRefundDays) {
      return NextResponse.json({
        success: false,
        message: `Refund period has expired. Orders can only be refunded within ${maxRefundDays} days.`
      }, { status: 400 });
    }

    // Process refund through payment gateway
    const paymentService = new PaymentService();
    const refundResult = await paymentService.processRefund(
      order.payment.method,
      order.payment.transactionId,
      order.pricing.totalAmount,
      reason
    );

    if (refundResult.success) {
      // Update order status
      await order.updateStatus('cancelled', `Refunded: ${reason}`);
      
      // Update payment information
      order.payment.status = 'refunded';
      order.payment.refundId = refundResult.refundId;
      order.payment.refundDate = new Date();
      order.payment.refundReason = reason;
      order.payment.refundAmount = refundResult.refundAmount || order.pricing.totalAmount;
      order.payment.requiresManualProcessing = refundResult.requiresManualProcessing || false;
      
      await order.save();

      // Log refund for admin tracking
      console.log(`Refund processed for order ${order.orderNumber}:`, {
        orderId: order._id,
        refundId: refundResult.refundId,
        amount: order.payment.refundAmount,
        method: order.payment.method,
        reason: reason,
        requiresManual: refundResult.requiresManualProcessing
      });

      return NextResponse.json({
        success: true,
        message: refundResult.message,
        refund: {
          refundId: refundResult.refundId,
          amount: order.payment.refundAmount,
          orderId: order._id,
          orderNumber: order.orderNumber,
          requiresManualProcessing: refundResult.requiresManualProcessing
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: refundResult.message
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json({
      success: false,
      message: 'Refund processing failed. Please try again.'
    }, { status: 500 });
  }
}

// GET /api/payment/refund?orderId=123 - Check refund status
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

    // Check authorization
    if (order.userId !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized access to order'
      }, { status: 403 });
    }

    // Return refund information
    const refundInfo = {
      isRefunded: order.payment.status === 'refunded',
      refundId: order.payment.refundId,
      refundDate: order.payment.refundDate,
      refundAmount: order.payment.refundAmount,
      refundReason: order.payment.refundReason,
      requiresManualProcessing: order.payment.requiresManualProcessing,
      canRequestRefund: order.payment.status === 'paid' && 
                       Math.floor((new Date() - new Date(order.createdAt)) / (1000 * 60 * 60 * 24)) <= 30
    };

    return NextResponse.json({
      success: true,
      refundInfo
    });

  } catch (error) {
    console.error('Refund status check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to check refund status'
    }, { status: 500 });
  }
}