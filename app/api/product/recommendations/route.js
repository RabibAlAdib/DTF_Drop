import { NextResponse } from 'next/server'
import Product from "@/models/Product"; // Import the Product model

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const excludeId = searchParams.get('exclude')
  
  try {
    // Fetch products from the database using the Product model
    const products = await Product.find({ 
      category: category,
      _id: { $ne: excludeId } 
    }).limit(4); // Limit to 4 recommendations
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}