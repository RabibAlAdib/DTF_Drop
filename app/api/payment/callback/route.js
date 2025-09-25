import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import { PaymentService } from '@/lib/paymentService';

await connectDB();

// POST /api/payment/callback - Handle payment gateway callbacks
export async function POST(req) {
  try {
    const callbackData = await req.json();
    const { paymentMethod, paymentID, orderId } = callbackData;

    console.log('Payment callback received:', { paymentMethod, paymentID, orderId });

    // Validate callback data
    if (!paymentMethod || !paymentID) {
      return NextResponse.json({
        success: false,
        message: 'Invalid callback data'
      }, { status: 400 });
    }

    // Find order by payment ID or order ID
    let order;
    if (orderId) {
      order = await Order.findById(orderId);
    } else {
      order = await Order.findOne({ 'payment.paymentId': paymentID });
    }

    if (!order) {
      return NextResponse.json({
        success: false,
        message: 'Order not found'
      }, { status: 404 });
    }

    // Process payment callback
    const paymentService = new PaymentService();
    const callbackResult = await paymentService.handlePaymentCallback(paymentMethod, callbackData);

    if (callbackResult.success) {
      // Capture previous payment status to avoid duplicate increments
      const wasPaymentCompleted = order.payment.status === 'completed';
      
      // Update order payment status
      order.payment = {
        ...order.payment,
        status: 'completed',
        transactionId: callbackResult.transactionId,
        completedAt: new Date()
      };
      
      // Update order status if payment is successful
      if (order.status === 'pending') {
        order.status = 'processing';
      }

      await order.save();

      // Update sales count for each product when payment is actually completed (avoid duplicates)
      if (!wasPaymentCompleted) {
        try {
          const { incrementSalesCount } = await import('@/lib/salesService');
          await incrementSalesCount(order.items);
          console.log(`✅ Sales count updated for order ${order.orderNumber} payment completion`);
        } catch (salesError) {
          console.error('❌ Failed to update sales count for completed payment:', salesError);
          // Don't fail the payment process if sales count update fails
        }
      } else {
        console.log(`🔄 Payment callback received for already completed order ${order.orderNumber} - skipping sales count update`);
      }

      console.log(`Payment completed for order ${order.orderNumber}:`, callbackResult);

      return NextResponse.json({
        success: true,
        message: 'Payment completed successfully',
        orderId: order._id,
        orderNumber: order.orderNumber,
        transactionId: callbackResult.transactionId
      });
    } else {
      // Update order payment status as failed
      order.payment = {
        ...order.payment,
        status: 'failed',
        failedAt: new Date()
      };

      await order.save();

      console.log(`Payment failed for order ${order.orderNumber}:`, callbackResult);

      return NextResponse.json({
        success: false,
        message: callbackResult.message || 'Payment verification failed'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment callback processing error:', error);
    return NextResponse.json({
      success: false,
      message: 'Payment callback processing failed'
    }, { status: 500 });
  }
}

// GET /api/payment/callback - Handle GET callbacks (for some payment gateways)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentID = searchParams.get('paymentID');
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');

    console.log('Payment GET callback received:', { paymentID, status, orderId });

    if (!paymentID) {
      return NextResponse.redirect(new URL('/order-failed', req.url));
    }

    // Find order
    let order;
    if (orderId) {
      order = await Order.findById(orderId);
    } else {
      order = await Order.findOne({ 'payment.paymentId': paymentID });
    }

    if (!order) {
      return NextResponse.redirect(new URL('/order-failed', req.url));
    }

    if (status === 'success' || status === 'completed') {
      // Redirect to success page
      return NextResponse.redirect(new URL(`/order-success?orderId=${order._id}`, req.url));
    } else {
      // Redirect to failed page
      return NextResponse.redirect(new URL(`/order-failed?orderId=${order._id}`, req.url));
    }

  } catch (error) {
    console.error('Payment GET callback error:', error);
    return NextResponse.redirect(new URL('/order-failed', req.url));
  }
}