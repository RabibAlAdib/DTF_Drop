import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Review from '@/models/Review';
import Product from '@/models/Product';

await connectDB();

// GET /api/reviews/[reviewId] - Get specific review
export async function GET(req, { params }) {
  try {
    const { reviewId } = params;
    
    const review = await Review.findById(reviewId)
      .populate('productId', 'name images price');
    
    if (!review) {
      return NextResponse.json({
        success: false,
        message: 'Review not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      review
    });

  } catch (error) {
    console.error('Get review error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch review'
    }, { status: 500 });
  }
}

// PUT /api/reviews/[reviewId] - Update review (owner only)
export async function PUT(req, { params }) {
  try {
    const { userId } = auth();
    const { reviewId } = params;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const { rating, title, content, images = [], variant = {} } = await req.json();

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({
        success: false,
        message: 'Review not found'
      }, { status: 404 });
    }

    // Check if user owns this review
    if (review.userId !== userId) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized to update this review'
      }, { status: 403 });
    }

    // Check if review can be edited (not older than 30 days)
    const reviewAge = Math.floor((new Date() - new Date(review.createdAt)) / (1000 * 60 * 60 * 24));
    if (reviewAge > 30) {
      return NextResponse.json({
        success: false,
        message: 'Reviews can only be edited within 30 days of creation'
      }, { status: 400 });
    }

    // Update review fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json({
          success: false,
          message: 'Rating must be between 1 and 5'
        }, { status: 400 });
      }
      review.rating = rating;
    }

    if (title !== undefined) review.title = title.trim();
    if (content !== undefined) review.content = content.trim();
    if (images !== undefined) {
      review.images = images.map(img => ({
        url: img.url,
        publicId: img.publicId,
        caption: img.caption || ''
      }));
    }
    if (variant !== undefined) {
      review.variant = {
        color: variant.color || review.variant.color,
        size: variant.size || review.variant.size
      };
    }

    // Set status back to pending if approved review was modified
    if (review.status === 'approved') {
      review.status = 'pending';
    }

    await review.save();

    // Update product rating
    await updateProductRating(review.productId);

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
      review
    });

  } catch (error) {
    console.error('Update review error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update review'
    }, { status: 500 });
  }
}

// DELETE /api/reviews/[reviewId] - Delete review (owner only)
export async function DELETE(req, { params }) {
  try {
    const { userId } = auth();
    const { reviewId } = params;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({
        success: false,
        message: 'Review not found'
      }, { status: 404 });
    }

    // Check if user owns this review or is admin
    const isOwner = review.userId === userId;
    // TODO: Add admin check when admin system is implemented
    const isAdmin = false;
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized to delete this review'
      }, { status: 403 });
    }

    const productId = review.productId;

    // Delete review
    await Review.findByIdAndDelete(reviewId);

    // Update product rating
    await updateProductRating(productId);

    console.log(`Review ${reviewId} deleted by user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete review'
    }, { status: 500 });
  }
}

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const stats = await Review.getProductRatingStats(productId);
    
    await Product.findByIdAndUpdate(productId, {
      rating: stats.averageRating || 0,
      reviews: stats.totalReviews || 0
    });
  } catch (error) {
    console.error('Failed to update product rating:', error);
  }
}