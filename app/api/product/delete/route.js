import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import Product from '@/models/Product';
import authSeller from '@/lib/authSeller';

export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Authentication required."
      }, { status: 401 });
    }
    
    // Check if user is a seller
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized Access. Only Sellers can delete products."
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({
        success: false,
        message: "Product ID is required."
      }, { status: 400 });
    }

    await connectDB();
    
    // Find the product and check if it belongs to the seller
    const product = await Product.findById(productId);
    
    if (!product) {
      return NextResponse.json({
        success: false,
        message: "Product not found."
      }, { status: 404 });
    }

    // Check if the product belongs to the current seller
    if (String(product.userId) !== String(userId)) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized. You can only delete your own products."
      }, { status: 403 });
    }

    // Delete the product
    await Product.findByIdAndDelete(productId);

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully."
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete product. Please try again."
    }, { status: 500 });
  }
}