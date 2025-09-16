import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import { PaymentService } from '@/lib/paymentService';

await connectDB();

// POST /api/payment/process - Process payment for an order
export async function POST(req) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const { orderId, paymentMethod } = await req.json();
    
    // Validate input
    if (!orderId || !paymentMethod) {
      return NextResponse.json({
        success: false,
        message: 'Order ID and payment method are required'
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

    // Verify order belongs to user
    if (order.userId !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized access to order'
      }, { status: 403 });
    }

    // Check if order is already paid
    if (order.payment.status === 'completed' || order.payment.status === 'paid') {
      return NextResponse.json({
        success: false,
        message: 'Order is already paid'
      }, { status: 400 });
    }

    // Process payment
    const paymentService = new PaymentService();
    const paymentResult = await paymentService.processPayment(paymentMethod, {
      orderNumber: order.orderNumber,
      totalAmount: order.pricing.totalAmount,
      customerInfo: order.customerInfo
    });

    if (paymentResult.success) {
      // Update order with payment information
      order.payment = {
        method: paymentMethod,
        status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'processing',
        paymentId: paymentResult.paymentId,
        transactionId: paymentResult.transactionId || null,
        processedAt: new Date()
      };

      await order.save();

      return NextResponse.json({
        success: true,
        message: paymentResult.message,
        paymentId: paymentResult.paymentId,
        redirectUrl: paymentResult.redirectUrl,
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          payment: order.payment
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: paymentResult.message
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({
      success: false,
      message: 'Payment processing failed. Please try again.'
    }, { status: 500 });
  }
}