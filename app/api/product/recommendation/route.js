import { NextResponse } from 'next/server'

// Sample product data - replace with your actual data source
const products = [
  // ... your product data ...
]

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const excludeId = searchParams.get('exclude')
  
  try {
    // Filter products by category and exclude current product
    const recommendations = products.filter(
      product => 
        product.category === category && 
        product.id !== parseInt(excludeId)
    )
    
    // Sort by popularity or rating if available
    recommendations.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    
    return NextResponse.json(recommendations)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}