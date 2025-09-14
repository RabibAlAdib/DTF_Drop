import { getAuth } from '@clerk/nextjs/server';
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

// Runtime configuration - much faster now without file uploads
export const runtime = 'nodejs';
export const maxDuration = 10; // Reduced to 10 seconds since no file processing

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    // Check if user is a seller
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized Access. Only Sellers are allowed to add products."
      }, { status: 401 });
    }

    // Parse JSON data instead of FormData
    const requestData = await request.json();
    const { 
      name, 
      description, 
      category, 
      price, 
      offerPrice,
      gender,
      designType,
      imageUrls,
      imageColors,
      sizes,
      colors
    } = requestData;

    // Validate required fields
    if (!name || !description || !category || !price) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields."
      }, { status: 400 });
    }

    // Validate image URLs are provided
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Please upload at least one image."
      }, { status: 400 });
    }

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

    // Set defaults for backward compatibility
    const finalGender = gender || 'both';
    const finalDesignType = designType || 'customized';
    const finalColors = (colors && colors.length > 0) ? colors : ['Black'];
    const finalSizes = (sizes && sizes.length > 0) ? sizes : ['M', 'L', 'XL'];

    // Create colorImages mapping from provided URLs and colors
    const colorImages = imageUrls.map((url, index) => ({
      url: url,
      color: imageColors?.[index] || 'Black'
    }));

    // Legacy images array for backward compatibility
    const images = imageUrls;

    // Connect to database
    await connectDB();

    // Generate variants for each color-size combination
    const variants = [];
    finalColors.forEach(color => {
      finalSizes.forEach(size => {
        variants.push({
          color,
          size,
          stock: 10, // Default stock for each variant
          sku: `${name.substring(0, 3).toUpperCase()}-${color.substring(0, 2).toUpperCase()}-${size}-${Date.now()}`
        });
      });
    });

    // Create product with provided image URLs
    const newProduct = new Product({
      userId,
      name,
      description,
      category,
      price: Number(price),
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      images: images, // Legacy field for backward compatibility
      colorImages: colorImages, // Color-aware images from URLs
      gender: finalGender,
      designType: finalDesignType,
      colors: finalColors,
      sizes: finalSizes,
      variants: variants,
      ratings: 4.3, // Default rating
      numOfReviews: 2, // Default number of reviews
      date: Date.now()
    });

    // Save the product to database
    const savedProduct = await newProduct.save();
    console.log("Product saved successfully:", savedProduct._id);

    return NextResponse.json({
      success: true,
      product: savedProduct,
      message: "Product added successfully."
    });

  } catch (error) {
    console.error("Error adding product:", error);
    
    return NextResponse.json({
      success: false,
      message: error.message || "Internal server error"
    }, { status: 500 });
  }
}