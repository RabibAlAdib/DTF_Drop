import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Coupon from '@/models/Coupon';
import Product from '@/models/Product';

await connectDB();

// GET /api/coupons - Get seller's coupons or validate coupon code
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
    const code = searchParams.get('code');
    const action = searchParams.get('action'); // 'validate' or 'list'
    const status = searchParams.get('status'); // 'active', 'expired', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate specific coupon code
    if (code && action === 'validate') {
      const coupon = await Coupon.findByCode(code);
      
      if (!coupon) {
        return NextResponse.json({
          success: false,
          message: 'Invalid coupon code'
        }, { status: 404 });
      }

      // Check if coupon is currently valid
      const validation = { valid: coupon.isCurrentlyValid };
      if (!validation.valid) {
        if (coupon.isExpired) {
          validation.reason = 'Coupon has expired';
        } else if (!coupon.isActive) {
          validation.reason = 'Coupon is not active';
        } else if (coupon.remainingUsage <= 0) {
          validation.reason = 'Coupon usage limit reached';
        }
      }

      return NextResponse.json({
        success: true,
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
        validation
      });
    }

    // List seller's coupons
    let query = { userId };

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
      query.validUntil = { $gte: new Date() };
    } else if (status === 'expired') {
      query.validUntil = { $lt: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const coupons = await Coupon.find(query)
      .populate('applicableProducts', 'name price')
      .populate('excludedProducts', 'name price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalCoupons = await Coupon.countDocuments(query);
    const totalPages = Math.ceil(totalCoupons / limit);

    // Get summary statistics
    const stats = {
      totalCoupons: await Coupon.countDocuments({ userId }),
      activeCoupons: await Coupon.countDocuments({ userId, isActive: true, validUntil: { $gte: new Date() } }),
      expiredCoupons: await Coupon.countDocuments({ userId, validUntil: { $lt: new Date() } }),
      inactiveCoupons: await Coupon.countDocuments({ userId, isActive: false }),
      totalDiscountGiven: await Coupon.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$totalDiscountGiven' } } }
      ]).then(result => result[0]?.total || 0),
      totalUsageCount: await Coupon.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$totalUsageCount' } } }
      ]).then(result => result[0]?.total || 0)
    };

    return NextResponse.json({
      success: true,
      coupons,
      stats,
      pagination: {
        currentPage: page,
        totalPages,
        totalCoupons,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get coupons error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch coupons'
    }, { status: 500 });
  }
}

// POST /api/coupons - Create a new coupon
export async function POST(req) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const couponData = await req.json();

    // Validate required fields
    const { 
      code, 
      name, 
      discountType, 
      discountValue, 
      validUntil,
      description = '',
      maxDiscountAmount,
      minimumOrderAmount = 0,
      maximumUsageLimit,
      usagePerCustomerLimit = 1,
      applicableProducts = [],
      excludedProducts = [],
      applicableCategories = [],
      couponType = 'general'
    } = couponData;

    if (!code || !name || !discountType || !discountValue || !validUntil) {
      return NextResponse.json({
        success: false,
        message: 'Code, name, discount type, discount value, and valid until date are required'
      }, { status: 400 });
    }

    // Validate discount value
    if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
      return NextResponse.json({
        success: false,
        message: 'Percentage discount must be between 1 and 100'
      }, { status: 400 });
    }

    if (discountType === 'fixed_amount' && discountValue <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Fixed amount discount must be greater than 0'
      }, { status: 400 });
    }

    // Validate valid until date
    if (new Date(validUntil) <= new Date()) {
      return NextResponse.json({
        success: false,
        message: 'Valid until date must be in the future'
      }, { status: 400 });
    }

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return NextResponse.json({
        success: false,
        message: 'Coupon code already exists'
      }, { status: 400 });
    }

    // Verify applicable products belong to seller
    if (applicableProducts && applicableProducts.length > 0) {
      const sellerProducts = await Product.find({ 
        _id: { $in: applicableProducts }, 
        userId 
      }).select('_id');
      
      if (sellerProducts.length !== applicableProducts.length) {
        return NextResponse.json({
          success: false,
          message: 'Some selected products do not belong to you'
        }, { status: 400 });
      }
    }

    // Create coupon
    const coupon = new Coupon({
      userId,
      code: code.toUpperCase().replace(/\s/g, ''),
      name: name.trim(),
      description: description.trim(),
      discountType,
      discountValue,
      maxDiscountAmount: discountType === 'percentage' ? maxDiscountAmount : undefined,
      minimumOrderAmount,
      maximumUsageLimit,
      usagePerCustomerLimit,
      applicableProducts,
      excludedProducts,
      applicableCategories,
      couponType,
      validFrom: new Date(),
      validUntil: new Date(validUntil),
      isActive: true
    });

    await coupon.save();

    console.log(`New coupon created: ${coupon.code} by user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Coupon created successfully',
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        validUntil: coupon.validUntil,
        isActive: coupon.isActive
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create coupon error:', error);
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'Coupon code already exists'
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to create coupon'
    }, { status: 500 });
  }
}