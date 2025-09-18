import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Product from '@/models/Product';
import User from '@/models/User';
import { isAdminUser } from '@/lib/authAdmin';

export async function GET(request) {
  try {
    // Check admin authentication
    if (!(await isAdminUser(request))) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    // Build query for admin - show ALL products
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (status && status !== 'all') {
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
    }

    // Get products with seller information
    const products = await Product.find(query)
      .populate('userId', 'firstName lastName username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    const totalProducts = await Product.countDocuments(query);
    
    // Add dummy products for testing if none exist
    if (products.length === 0 && page === 1) {
      const dummyProducts = [
        {
          _id: 'dummy1',
          name: 'Classic Drop Shoulder Tee',
          description: 'Comfortable and stylish drop shoulder t-shirt perfect for casual wear',
          price: 899,
          offerPrice: 799,
          category: 'drop-shoulder',
          designType: 'basic',
          images: ['/images/dummy-tshirt.jpg'],
          colors: ['Black', 'White', 'Gray'],
          sizes: ['S', 'M', 'L', 'XL'],
          isActive: true,
          userId: { firstName: 'John', lastName: 'Seller', email: 'seller@example.com' },
          createdAt: new Date(),
          rating: 4.5,
          reviewsCount: 25
        },
        {
          _id: 'dummy2',
          name: 'Custom Design Drop Shoulder',
          description: 'Premium drop shoulder t-shirt with custom design options',
          price: 1299,
          offerPrice: 1099,
          category: 'drop-shoulder',
          designType: 'custom',
          images: ['/images/dummy-custom.jpg'],
          colors: ['Navy', 'Maroon', 'Forest Green'],
          sizes: ['M', 'L', 'XL', 'XXL'],
          isActive: true,
          userId: { firstName: 'Jane', lastName: 'Designer', email: 'designer@example.com' },
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          rating: 4.8,
          reviewsCount: 12
        }
      ];
      
      return NextResponse.json({
        success: true,
        products: dummyProducts,
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalProducts: dummyProducts.length,
          hasNextPage: false,
          hasPrevPage: false
        },
        message: 'Dummy data displayed - no products found in database'
      });
    }

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        hasNextPage: page < Math.ceil(totalProducts / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching admin product list:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch products'
    }, { status: 500 });
  }
}