import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Coupon from '@/models/Coupon';
import Product from '@/models/Product';

await connectDB();

// GET /api/coupons/[couponId] - Get specific coupon
export async function GET(req, { params }) {
  try {
    const { userId } = auth();
    const { couponId } = await params;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const coupon = await Coupon.findById(couponId)
      .populate('applicableProducts', 'name price images')
      .populate('excludedProducts', 'name price images');
    
    if (!coupon) {
      return NextResponse.json({
        success: false,
        message: 'Coupon not found'
      }, { status: 404 });
    }

    // Check if user owns this coupon
    if (coupon.userId !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized access to coupon'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      coupon
    });

  } catch (error) {
    console.error('Get coupon error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch coupon'
    }, { status: 500 });
  }
}

// PUT /api/coupons/[couponId] - Update coupon
export async function PUT(req, { params }) {
  try {
    const { userId } = auth();
    const { couponId } = params;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const updates = await req.json();

    // Find coupon
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return NextResponse.json({
        success: false,
        message: 'Coupon not found'
      }, { status: 404 });
    }

    // Check ownership
    if (coupon.userId !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized to update this coupon'
      }, { status: 403 });
    }

    // Prevent updating code if coupon has been used
    if (updates.code && coupon.totalUsageCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'Cannot change coupon code after it has been used'
      }, { status: 400 });
    }

    // Validate discount value if provided
    if (updates.discountValue !== undefined) {
      const discountType = updates.discountType || coupon.discountType;
      
      if (discountType === 'percentage' && (updates.discountValue <= 0 || updates.discountValue > 100)) {
        return NextResponse.json({
          success: false,
          message: 'Percentage discount must be between 1 and 100'
        }, { status: 400 });
      }

      if (discountType === 'fixed_amount' && updates.discountValue <= 0) {
        return NextResponse.json({
          success: false,
          message: 'Fixed amount discount must be greater than 0'
        }, { status: 400 });
      }
    }

    // Validate valid until date if provided
    if (updates.validUntil && new Date(updates.validUntil) <= new Date()) {
      return NextResponse.json({
        success: false,
        message: 'Valid until date must be in the future'
      }, { status: 400 });
    }

    // Check if new code already exists (if code is being updated)
    if (updates.code && updates.code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ 
        code: updates.code.toUpperCase(),
        _id: { $ne: couponId }
      });
      
      if (existingCoupon) {
        return NextResponse.json({
          success: false,
          message: 'Coupon code already exists'
        }, { status: 400 });
      }
    }

    // Verify applicable products belong to seller if provided
    if (updates.applicableProducts && updates.applicableProducts.length > 0) {
      const sellerProducts = await Product.find({ 
        _id: { $in: updates.applicableProducts }, 
        userId 
      }).select('_id');
      
      if (sellerProducts.length !== updates.applicableProducts.length) {
        return NextResponse.json({
          success: false,
          message: 'Some selected products do not belong to you'
        }, { status: 400 });
      }
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'description', 'discountType', 'discountValue', 'maxDiscountAmount',
      'minimumOrderAmount', 'maximumUsageLimit', 'usagePerCustomerLimit',
      'applicableProducts', 'excludedProducts', 'applicableCategories',
      'validUntil', 'isActive', 'couponType'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        coupon[field] = updates[field];
      }
    });

    // Handle code update separately
    if (updates.code) {
      coupon.code = updates.code.toUpperCase().replace(/\s/g, '');
    }

    await coupon.save();

    console.log(`Coupon ${coupon.code} updated by user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Coupon updated successfully',
      coupon
    });

  } catch (error) {
    console.error('Update coupon error:', error);
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'Coupon code already exists'
      }, { status: 400 });
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to update coupon'
    }, { status: 500 });
  }
}

// DELETE /api/coupons/[couponId] - Delete coupon
export async function DELETE(req, { params }) {
  try {
    const { userId } = auth();
    const { couponId } = params;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    // Find coupon
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return NextResponse.json({
        success: false,
        message: 'Coupon not found'
      }, { status: 404 });
    }

    // Check ownership
    if (coupon.userId !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized to delete this coupon'
      }, { status: 403 });
    }

    // Check if coupon has been used
    if (coupon.totalUsageCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'Cannot delete coupon that has been used. Deactivate it instead.'
      }, { status: 400 });
    }

    await Coupon.findByIdAndDelete(couponId);

    console.log(`Coupon ${coupon.code} deleted by user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete coupon'
    }, { status: 500 });
  }
}