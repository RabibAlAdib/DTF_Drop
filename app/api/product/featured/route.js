import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Order from '@/models/Order';
import Product from '@/models/Product';

export async function GET(request) {
  try {
    await connectDB();
    
    // Aggregate orders to find most sold products
    const mostSoldProducts = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'processing', 'shipped'] } } }, // Only count meaningful orders
      { $unwind: '$items' }, // Unwind items array
      { 
        $group: {
          _id: '$items.productId',
          totalQuantitySold: { $sum: '$items.quantity' },
          totalOrders: { $sum: 1 },
          productName: { $first: '$items.productName' },
          productImage: { $first: '$items.productImage' }
        }
      },
      { $sort: { totalQuantitySold: -1, totalOrders: -1 } }, // Sort by quantity sold, then by number of orders
      { $limit: 6 } // Top 6 most sold products
    ]);

    // If we have aggregated data, fetch full product details
    if (mostSoldProducts.length > 0) {
      const productIds = mostSoldProducts.map(item => item._id).filter(id => id); // Filter out null/undefined IDs
      
      if (productIds.length > 0) {
        const fullProducts = await Product.find({ _id: { $in: productIds } })
          .lean()
          .select('name price offerPrice images colorImages category date description gender designType colors sizes ratings numOfReviews variants numberofSales');

        // Combine product data with sales data
        const featuredProducts = mostSoldProducts.map(soldItem => {
          const productDetails = fullProducts.find(p => p._id.toString() === soldItem._id?.toString());
          if (productDetails) {
            return {
              ...productDetails,
              totalQuantitySold: soldItem.totalQuantitySold,
              totalOrders: soldItem.totalOrders,
              isFeatured: true
            };
          }
          return null;
        }).filter(Boolean); // Remove null entries

        if (featuredProducts.length > 0) {
          return NextResponse.json({
            success: true,
            products: featuredProducts,
            source: 'sales_data'
          });
        }
      }
    }

    // Fallback: If no sales data available, return newest products
    console.log('No sales data found, falling back to newest products');
    const fallbackProducts = await Product.find({})
      .sort({ date: -1 })
      .limit(6)
      .lean()
      .select('name price offerPrice images colorImages category date description gender designType colors sizes ratings numOfReviews variants numberofSales');
    
    return NextResponse.json({
      success: true,
      products: fallbackProducts,
      source: 'fallback_newest'
    });

  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}