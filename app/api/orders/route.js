import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import { 
  validateOrderData, 
  calculateOrderTotal,
  convertCartToOrderItems 
} from '@/lib/orderCalculations';
import { 
  sendOrderConfirmationEmail,
  sendSellerNotificationEmail 
} from '@/lib/emailService';

// Connect to database
await connectDB();

// POST /api/orders - Create new order
export async function POST(req) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const orderData = await req.json();
    
    // Validate order data
    const validation = validateOrderData(orderData);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: `Validation failed: ${validation.errors[0]}`,
        errors: validation.errors
      }, { status: 400 });
    }

    // Verify products exist and calculate accurate pricing
    const verifiedItems = [];
    let calculatedSubtotal = 0;

    for (const item of orderData.items) {
      // Find the product
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json({
          success: false,
          message: `Product not found: ${item.productId}`
        }, { status: 400 });
      }

      // Verify variant availability
      if (!product.colors.includes(item.color)) {
        return NextResponse.json({
          success: false,
          message: `Color '${item.color}' not available for product: ${product.name}`
        }, { status: 400 });
      }

      if (!product.sizes.includes(item.size)) {
        return NextResponse.json({
          success: false,
          message: `Size '${item.size}' not available for product: ${product.name}`
        }, { status: 400 });
      }

      // Use current product price (not client-provided price)
      const currentPrice = product.offerPrice || product.price;
      const totalPrice = currentPrice * item.quantity;
      calculatedSubtotal += totalPrice;

      // Get variant-specific image
      let productImage = product.images?.[0] || '';
      if (product.colorImages && item.color) {
        const colorImage = product.colorImages.find(ci => ci.color === item.color);
        if (colorImage) productImage = colorImage.url;
      }

      verifiedItems.push({
        productId: item.productId,
        productName: product.name,
        color: item.color,
        size: item.size,
        unitPrice: currentPrice,
        quantity: item.quantity,
        totalPrice: totalPrice,
        productImage: productImage,
        customization: item.customization || {
          hasCustomDesign: false,
          customDesignUrl: '',
          customText: '',
          customNumber: '',
          customSlogan: '',
          specialInstructions: ''
        }
      });
    }

    // Recalculate order total with verified pricing
    const orderCalculation = calculateOrderTotal(
      verifiedItems, 
      orderData.delivery.address, 
      orderData.pricing.promoCode
    );

    if (!orderCalculation.success) {
      return NextResponse.json({
        success: false,
        message: 'Order calculation failed',
        error: orderCalculation.error
      }, { status: 400 });
    }

    // Create order object
    const order = new Order({
      userId: userId,
      customerInfo: orderData.customerInfo,
      items: verifiedItems,
      pricing: {
        subtotal: orderCalculation.calculation.subtotal,
        deliveryCharge: orderCalculation.calculation.deliveryCharge,
        discountAmount: orderCalculation.calculation.discountAmount,
        promoCode: orderData.pricing.promoCode || null,
        totalAmount: orderCalculation.calculation.totalAmount
      },
      delivery: {
        address: orderData.delivery.address,
        isDhaka: orderCalculation.calculation.delivery.isDhaka,
        deliveryCharge: orderCalculation.calculation.deliveryCharge,
        deliveryNotes: orderData.delivery.deliveryNotes || ''
      },
      payment: {
        method: orderData.payment.method || 'cash_on_delivery',
        status: 'pending'
      },
      giftInfo: {
        isGift: orderData.giftInfo?.isGift || false,
        giftMessage: orderData.giftInfo?.giftMessage || '',
        recipientName: orderData.giftInfo?.recipientName || ''
      },
      status: 'pending'
    });

    // Save the order
    const savedOrder = await order.save();

    // Clear user's cart after successful order
    try {
      await User.findByIdAndUpdate(
        userId,
        { 
          cartItems: {},
          // Update user contact info if provided
          contact: orderData.customerInfo.phone,
          address: orderData.customerInfo.address
        }
      );
    } catch (cartError) {
      console.error('Error clearing cart:', cartError);
      // Don't fail the order if cart clearing fails
    }

    // Update product sales count (optional analytics)
    try {
      for (const item of verifiedItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { numberofSales: item.quantity } }
        );
      }
    } catch (salesError) {
      console.error('Error updating sales count:', salesError);
      // Don't fail the order if sales update fails
    }

    // Send email notifications (don't fail order if emails fail)
    try {
      // Send order confirmation to customer
      await sendOrderConfirmationEmail(savedOrder);
      
      // Send notification to sellers for their products
      const sellerProductIds = [...new Set(verifiedItems.map(item => item.productId))];
      const sellerProducts = await Product.find({ _id: { $in: sellerProductIds } }).populate('userId', 'email');
      
      const sellerEmails = [...new Set(sellerProducts.map(product => product.userId?.email).filter(Boolean))];
      
      for (const sellerEmail of sellerEmails) {
        await sendSellerNotificationEmail(savedOrder, sellerEmail);
      }
      
      console.log('📧 Order notification emails sent successfully');
    } catch (emailError) {
      console.error('📧 Error sending order emails (order still successful):', emailError);
      // Don't fail the order if email sending fails
    }

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      order: {
        _id: savedOrder._id,
        orderNumber: savedOrder.orderNumber,
        status: savedOrder.status,
        totalAmount: savedOrder.pricing.totalAmount,
        createdAt: savedOrder.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create order. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// GET /api/orders - Get user orders with pagination
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    // Build query
    let query = { userId: userId };
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

    // Format orders for response
    const formattedOrders = orders.map(order => ({
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
        hasCustomization: item.customization.hasCustomDesign || 
                          item.customization.customText || 
                          item.customization.customNumber ||
                          item.customization.customSlogan
      })),
      pricing: order.pricing,
      delivery: order.delivery,
      payment: order.payment,
      giftInfo: order.giftInfo,
      totalItems: order.totalItems,
      orderAge: order.orderAge,
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
    console.error('Get orders error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch orders. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}