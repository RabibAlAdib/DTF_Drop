import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Product from '@/models/Product';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 50); // Max 50 items
    const category = searchParams.get('category');
    const gender = searchParams.get('gender');
    const designType = searchParams.get('designType');
    const sortBy = searchParams.get('sortBy') || 'newest';
    
    // Build query filters
    const query = {};
    if (category) query.category = category;
    if (gender) query.gender = gender;
    if (designType) query.designType = designType;
    
    // Build sort options
    let sortOptions = { date: -1 }; // default newest first
    switch (sortBy) {
      case 'price-low':
        sortOptions = { price: 1 };
        break;
      case 'price-high':
        sortOptions = { price: -1 };
        break;
      case 'popular':
        sortOptions = { numberofSales: -1, date: -1 };
        break;
      case 'rating':
        sortOptions = { ratings: -1, date: -1 };
        break;
    }
    
    const skip = (page - 1) * limit;
    
    // Execute query with optimizations
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select('name price offerPrice images colorImages category date description gender designType colors sizes ratings numOfReviews numberofSales')
        .lean()
        .maxTimeMS(10000), // 10 second timeout
      Product.countDocuments(query)
    ]);
    
    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

