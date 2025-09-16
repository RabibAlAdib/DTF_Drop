import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Review from '@/models/Review';
import Product from '@/models/Product';

await connectDB();

// GET /api/reviews/moderate - Get pending reviews for moderation
export async function GET(req) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    // TODO: Add seller/admin authorization check
    // For now, allowing all authenticated users to moderate reviews for their products

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get reviews needing moderation
    let query = { status };
    
    // If not admin, only show reviews for seller's products
    const sellerProducts = await Product.find({ userId }).select('_id');
    const sellerProductIds = sellerProducts.map(p => p._id);
    
    if (sellerProductIds.length > 0) {
      query.productId = { $in: sellerProductIds };
    } else {
      // If seller has no products, return empty result
      return NextResponse.json({
        success: true,
        reviews: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalReviews: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      });
    }

    const reviews = await Review.find(query)
      .populate('productId', 'name images price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalReviews = await Review.countDocuments(query);
    const totalPages = Math.ceil(totalReviews / limit);

    return NextResponse.json({
      success: true,
      reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get moderation reviews error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch reviews for moderation'
    }, { status: 500 });
  }
}

// POST /api/reviews/moderate - Moderate a review
export async function POST(req) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const { reviewId, action, reason = '' } = await req.json();

    // Validate input
    if (!reviewId || !action) {
      return NextResponse.json({
        success: false,
        message: 'Review ID and action are required'
      }, { status: 400 });
    }

    const validActions = ['approve', 'reject', 'hide'];
    if (!validActions.includes(action)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid action. Must be approve, reject, or hide'
      }, { status: 400 });
    }

    // Find the review
    const review = await Review.findById(reviewId).populate('productId', 'userId');
    if (!review) {
      return NextResponse.json({
        success: false,
        message: 'Review not found'
      }, { status: 404 });
    }

    // Check if user has permission to moderate this review
    const canModerate = review.productId.userId === userId; // Seller can moderate their product reviews
    // TODO: Add admin check
    
    if (!canModerate) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized to moderate this review'
      }, { status: 403 });
    }

    // Apply moderation action
    let updatedReview;
    switch (action) {
      case 'approve':
        updatedReview = await review.approve();
        break;
      case 'reject':
        updatedReview = await review.reject(reason);
        break;
      case 'hide':
        updatedReview = await review.hide(reason);
        break;
    }

    // Update product rating if review was approved or status changed
    if (action === 'approve' || review.status === 'approved') {
      await updateProductRating(review.productId._id);
    }

    console.log(`Review ${reviewId} ${action}ed by user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Review ${action}ed successfully`,
      review: {
        _id: updatedReview._id,
        status: updatedReview.status,
        moderationReason: updatedReview.moderationReason
      }
    });

  } catch (error) {
    console.error('Moderate review error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to moderate review'
    }, { status: 500 });
  }
}

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const stats = await Review.getProductRatingStats(productId);
    
    await Product.findByIdAndUpdate(productId, {
      rating: stats.averageRating || 0,
      reviewCount: stats.totalReviews || 0
    });
    
    console.log(`Updated product ${productId} rating: ${stats.averageRating} (${stats.totalReviews} reviews)`);
  } catch (error) {
    console.error('Failed to update product rating:', error);
  }
}