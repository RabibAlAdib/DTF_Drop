import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';
import connectDB from '@/config/db';
import Review from '@/models/Review';
import Product from '@/models/Product';
import Order from '@/models/Order';
import { getAuth } from '@/lib/authUtil';

await connectDB();

// GET /api/reviews - Get reviews with filtering
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');
    const requestedStatus = searchParams.get('status') || 'approved';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'newest';
    
    // Security: Determine allowed status based on authentication and role
    let allowedStatus = 'approved'; // Default to approved for public access
    
    try {
      const { userId: authUserId } = auth();
      const user = await currentUser();
      
      if (authUserId && user) {
        // Check if user is admin (you can customize this logic)
        const isAdmin = user.emailAddresses?.some(email => 
          email.emailAddress === 'dtfdrop25@gmail.com'
        ) || false;
        
        if (isAdmin) {
          // Admins can see all statuses
          allowedStatus = requestedStatus;
        } else if (userId && userId === authUserId) {
          // Users can see their own reviews in any status
          allowedStatus = requestedStatus;
        } else {
          // Regular authenticated users can only see approved reviews
          allowedStatus = 'approved';
        }
      }
    } catch (authError) {
      // If auth fails, default to approved only
      console.log('Auth check failed, defaulting to approved reviews only');
      allowedStatus = 'approved';
    }
    
    // Build query
    let query = {};
    if (productId) query.productId = productId;
    if (userId) query.userId = userId;
    if (allowedStatus !== 'all') query.status = allowedStatus;

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
    // Use proper authentication that handles both cookies and Bearer tokens
    const authResult = await getAuth(req);
    
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.message || "Authentication required"
      }, { status: 401 });
    }

    const userId = authResult.userId;
    
    // Get user data from Clerk
    const clerkClient = createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY 
    });
    const user = await clerkClient.users.getUser(userId);

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