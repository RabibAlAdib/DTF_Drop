import { NextResponse } from 'next/server'

// Sample product data - replace with your actual data source
const products = [
  // Your product data here
]

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const excludeId = searchParams.get('exclude')
  
  try {
    // Filter products by category and exclude current product
    const recommendations = products.filter(
      product => product.category === category && product._id !== excludeId
    )
    
    // Limit to 4 recommendations
    const limitedRecommendations = recommendations.slice(0, 4)
    
    return NextResponse.json(limitedRecommendations)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}