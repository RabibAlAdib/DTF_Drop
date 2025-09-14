import { v2 as cloudinary } from "cloudinary";
import { getAuth } from '@clerk/nextjs/server';
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

// Runtime configuration for handling large uploads
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds for upload timeout

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

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

    const formData = await request.formData();
    const productId = formData.get('productId');
    const name = formData.get('name');
    const description = formData.get('description');
    const category = formData.get('category');
    const price = formData.get('price');
    const offerPrice = formData.get('offerPrice');
    
    // Get additional fields
    const gender = formData.get('gender');
    const designType = formData.get('designType');
    const colors = formData.getAll('colors');
    const sizes = formData.getAll('sizes');

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
    const imageFiles = [];
    const imageColors = [];
    let imageIndex = 0;
    
    // Collect new image-color pairs if provided
    while (formData.get(`image_${imageIndex}`)) {
      imageFiles.push(formData.get(`image_${imageIndex}`));
      imageColors.push(formData.get(`color_${imageIndex}`));
      imageIndex++;
    }

    let finalColorImages = existingProduct.colorImages || [];
    let finalImages = existingProduct.images || [];

    // Upload new images if provided
    if (imageFiles.length > 0) {
      if (imageFiles.length > 10) {
        return NextResponse.json({
          success: false,
          message: "Maximum 10 images allowed per product."
        }, { status: 400 });
      }

      // Validate individual file sizes (max 10MB per image)
      const maxFileSize = 10 * 1024 * 1024; // 10MB in bytes
      let totalSize = 0;
      const oversizedFiles = [];
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        if (file.size > maxFileSize) {
          oversizedFiles.push({
            name: file.name || `Image ${i + 1}`,
            size: (file.size / 1024 / 1024).toFixed(2) + 'MB'
          });
        }
        totalSize += file.size;
      }

      if (oversizedFiles.length > 0) {
        return NextResponse.json({
          success: false,
          message: `The following images are too large (max 10MB each): ${oversizedFiles.map(f => `${f.name} (${f.size})`).join(', ')}`
        }, { status: 413 });
      }

      // Validate total payload size (max 45MB to stay under 50MB limit with overhead)
      const maxTotalSize = 45 * 1024 * 1024; // 45MB in bytes
      if (totalSize > maxTotalSize) {
        return NextResponse.json({
          success: false,
          message: `Total images size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (45MB). Please reduce image sizes or upload fewer images.`
        }, { status: 413 });
      }

      const uploadResults = await Promise.all(
        imageFiles.map(async (file, index) => {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { 
                resource_type: 'auto',
                transformation: [
                  { width: 800, height: 800, crop: 'limit' },
                  { quality: 'auto', fetch_format: 'auto' }
                ]
              },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve({
                    url: result.secure_url,
                    color: imageColors[index] || 'Black'
                  });
                }
              }
            );
            stream.end(buffer);
          });
        })
      );

      // Replace images if new ones are uploaded
      finalColorImages = uploadResults;
      finalImages = uploadResults.map(result => result.url);
    }

    // Set defaults for backward compatibility
    const finalGender = gender || existingProduct.gender || 'both';
    const finalDesignType = designType || existingProduct.designType || 'customized';
    const finalColors = (colors && colors.length > 0) ? colors : (existingProduct.colors || ['Black']);
    const finalSizes = (sizes && sizes.length > 0) ? sizes : (existingProduct.sizes || ['M']);

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
    
    // Return appropriate status codes based on error type
    const statusCode = error.message.includes('too large') || error.message.includes('exceeds maximum') ? 413 : 500;
    
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to update product. Please try again."
    }, { status: statusCode });
  }
}