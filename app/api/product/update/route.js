import { getAuth } from '@clerk/nextjs/server';
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

// Runtime configuration - much faster now without file uploads
export const runtime = 'nodejs';
export const maxDuration = 10; // Reduced to 10 seconds since no file processing

export async function PUT(request) {
  try {
    const { userId } = getAuth(request);
    
    // Check if user is a seller
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized Access. Only Sellers are allowed to update products."
      }, { status: 401 });
    }

    // Parse JSON data instead of FormData
    const requestData = await request.json();
    const { 
      productId,
      name, 
      description, 
      category, 
      price, 
      offerPrice,
      gender,
      designType,
      imageUrls, // New image URLs (if user wants to replace images)
      imageColors, // Colors for new images
      sizes,
      colors
    } = requestData;

    // Validate required fields
    if (!productId || !name || !description || !category || !price) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields."
      }, { status: 400 });
    }

    // Connect to database
    await connectDB();

    // Find the existing product and verify ownership
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return NextResponse.json({
        success: false,
        message: "Product not found."
      }, { status: 404 });
    }

    if (String(existingProduct.userId) !== String(userId)) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized. You can only update your own products."
      }, { status: 403 });
    }

    // Handle image updates
    let finalColorImages = existingProduct.colorImages || [];
    let finalImages = existingProduct.images || [];

    // If new image URLs are provided, validate and use them
    if (imageUrls && imageUrls.length > 0) {
      if (imageUrls.length > 10) {
        return NextResponse.json({
          success: false,
          message: "Maximum 10 images allowed per product."
        }, { status: 400 });
      }

      // Validate all image URLs are from our Cloudinary account (security check)
      const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const validCloudinaryPattern = new RegExp(`^https://res\\.cloudinary\\.com/${cloudinaryCloudName}/`);
      
      for (const url of imageUrls) {
        if (!validCloudinaryPattern.test(url)) {
          return NextResponse.json({
            success: false,
            message: "Invalid image URL detected. All images must be uploaded through our system."
          }, { status: 400 });
        }
      }

      // Replace images with new ones
      finalColorImages = imageUrls.map((url, index) => ({
        url: url,
        color: imageColors?.[index] || 'Black'
      }));
      finalImages = imageUrls;
    }

    // Set defaults for backward compatibility
    const finalGender = gender || existingProduct.gender || 'both';
    const finalDesignType = designType || existingProduct.designType || 'customized';
    const finalColors = (colors && colors.length > 0) ? colors : (existingProduct.colors || ['Black']);
    const finalSizes = (sizes && sizes.length > 0) ? sizes : (existingProduct.sizes || ['M', 'L', 'XL']);

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        description,
        category,
        price: parseFloat(price),
        offerPrice: offerPrice ? parseFloat(offerPrice) : existingProduct.offerPrice,
        gender: finalGender,
        designType: finalDesignType,
        colors: finalColors,
        sizes: finalSizes,
        colorImages: finalColorImages,
        images: finalImages,
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Product updated successfully!",
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to update product. Please try again."
    }, { status: 500 });
  }
}