import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Coupon from '@/models/Coupon';

await connectDB();

// POST /api/coupons/validate - Validate coupon for specific order
export async function POST(req) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const { code, orderData } = await req.json();

    if (!code || !orderData) {
      return NextResponse.json({
        success: false,
        message: 'Coupon code and order data are required'
      }, { status: 400 });
    }

    // Validate order data structure
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Invalid order data: items array is required'
      }, { status: 400 });
    }

    if (typeof orderData.subtotal !== 'number' || orderData.subtotal <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Invalid order data: subtotal is required'
      }, { status: 400 });
    }

    // Find coupon
    const coupon = await Coupon.findByCode(code);
    if (!coupon) {
      return NextResponse.json({
        success: false,
        message: 'Invalid coupon code',
        validation: {
          valid: false,
          reason: 'Coupon not found'
        }
      }, { status: 404 });
    }

    // Validate coupon for the order
    const validation = coupon.validateForOrder(orderData, userId);
    
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        message: validation.reason,
        validation
      }, { status: 400 });
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(orderData);
    
    // Return validation result with discount calculation
    return NextResponse.json({
      success: true,
      message: 'Coupon is valid',
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minimumOrderAmount: coupon.minimumOrderAmount,
        validUntil: coupon.validUntil,
        remainingUsage: coupon.remainingUsage,
        couponType: coupon.couponType
      },
      validation: {
        valid: true,
        discountAmount,
        finalTotal: Math.max(0, orderData.subtotal - discountAmount),
        savings: discountAmount
      }
    });

  } catch (error) {
    console.error('Validate coupon error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to validate coupon'
    }, { status: 500 });
  }
}

// GET /api/coupons/validate - Quick code validation (without order details)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({
        success: false,
        message: 'Coupon code is required'
      }, { status: 400 });
    }

    // Find coupon
    const coupon = await Coupon.findByCode(code);
    if (!coupon) {
      return NextResponse.json({
        success: false,
        message: 'Invalid coupon code'
      }, { status: 404 });
    }

    // Basic validation (existence and active status)
    const isValid = coupon.isCurrentlyValid;
    let validationMessage = 'Coupon is valid';
    
    if (!isValid) {
      if (coupon.isExpired) {
        validationMessage = 'Coupon has expired';
      } else if (!coupon.isActive) {
        validationMessage = 'Coupon is not active';
      } else if (coupon.remainingUsage <= 0) {
        validationMessage = 'Coupon usage limit reached';
      } else {
        validationMessage = 'Coupon is not currently valid';
      }
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minimumOrderAmount: coupon.minimumOrderAmount,
        validUntil: coupon.validUntil,
        remainingUsage: coupon.remainingUsage,
        couponType: coupon.couponType
      },
      validation: {
        valid: isValid,
        message: validationMessage
      }
    });

  } catch (error) {
    console.error('Quick validate coupon error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to validate coupon'
    }, { status: 500 });
  }
}