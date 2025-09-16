import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Review from '@/models/Review';
import Product from '@/models/Product';
import Order from '@/models/Order';

await connectDB();

// GET /api/reviews - Get reviews with filtering
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'approved';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'newest';
    
    // Build query
    let query = {};
    if (productId) query.productId = productId;
    if (userId) query.userId = userId;
    if (status !== 'all') query.status = status;

    // Build sort criteria
    let sort = {};
    switch (sortBy) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'highest_rated':
        sort = { rating: -1, createdAt: -1 };
        break;
      case 'lowest_rated':
        sort = { rating: 1, createdAt: -1 };
        break;
      case 'most_helpful':
        sort = { helpfulVotes: -1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Get reviews with pagination
    const reviews = await Review.find(query)
      .populate('productId', 'name images price')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get total count for pagination
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
    console.error('Get reviews error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch reviews'
    }, { status: 500 });
  }
}

// POST /api/reviews - Create a new review
export async function POST(req) {
  try {
    const { userId } = auth();
    const user = await currentUser();
    
    if (!userId || !user) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const { 
      productId, 
      rating, 
      title, 
      content, 
      images = [],
      variant = {}
    } = await req.json();

    // Validate required fields
    if (!productId || !rating || !title || !content) {
      return NextResponse.json({
        success: false,
        message: 'Product ID, rating, title, and content are required'
      }, { status: 400 });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json({
        success: false,
        message: 'Rating must be between 1 and 5'
      }, { status: 400 });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({
        success: false,
        message: 'Product not found'
      }, { status: 404 });
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return NextResponse.json({
        success: false,
        message: 'You have already reviewed this product'
      }, { status: 400 });
    }

    // Check if this is a verified purchase
    const purchaseOrder = await Order.findOne({
      userId,
      'items.productId': productId,
      status: 'delivered'
    });

    // Create review
    const review = new Review({
      productId,
      userId,
      orderId: purchaseOrder?._id || null,
      rating,
      title: title.trim(),
      content: content.trim(),
      images: images.map(img => ({
        url: img.url,
        publicId: img.publicId,
        caption: img.caption || ''
      })),
      isVerifiedPurchase: !!purchaseOrder,
      reviewer: {
        name: user.fullName || `${user.firstName} ${user.lastName}`,
        imageUrl: user.imageUrl
      },
      variant: {
        color: variant.color || '',
        size: variant.size || ''
      },
      status: 'pending' // Reviews need approval
    });

    await review.save();

    // Update product rating (will be recalculated when review is approved)
    await updateProductRating(productId);

    console.log(`New review created for product ${productId} by user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully. It will be visible after moderation.',
      review: {
        _id: review._id,
        rating: review.rating,
        title: review.title,
        status: review.status,
        isVerifiedPurchase: review.isVerifiedPurchase
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create review. Please try again.'
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