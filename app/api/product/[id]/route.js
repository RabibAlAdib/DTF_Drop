import { NextResponse } from 'next/server'
import Product from "@/models/Product";

export async function GET(request, { params }) {
  try {
    const { id } = params
    
    // Find product by ID
    const product = Product.find(p => p._id === id)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}