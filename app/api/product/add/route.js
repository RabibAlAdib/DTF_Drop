import { v2 as cloudinary } from "cloudinary";
import { getAuth } from '@clerk/nextjs/server';
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    // Check if user is a seller
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized Access. Only Sellers are allowed to add products."
      });
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const category = formData.get('category');
    const price = formData.get('price');
    const offerPrice = formData.get('offerPrice');
    
    // NEW: Get color-aware images
    const imageFiles = [];
    const imageColors = [];
    let imageIndex = 0;
    
    // Collect all image-color pairs
    while (formData.get(`image_${imageIndex}`)) {
      imageFiles.push(formData.get(`image_${imageIndex}`));
      imageColors.push(formData.get(`color_${imageIndex}`));
      imageIndex++;
    }
    
    // Fallback for legacy format
    if (imageFiles.length === 0) {
      const files = formData.getAll('images');
      const colors = formData.getAll('colors');
      imageFiles.push(...files);
      imageColors.push(...(colors.length > 0 ? colors : ['Black']));
    }
    
    // NEW: Get additional fields
    const gender = formData.get('gender');
    const designType = formData.get('designType');
    const colors = formData.getAll('colors');
    const sizes = formData.getAll('sizes');

    // Validate required fields (gender and designType optional for backward compatibility)
    if (!name || !description || !category || !price) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields."
      });
    }

    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Please upload at least one image."
      });
    }

    if (imageFiles.length > 10) {
      return NextResponse.json({
        success: false,
        message: "Maximum 10 images allowed per product."
      });
    }

    // Set defaults for backward compatibility
    const finalGender = gender || 'both';
    const finalDesignType = designType || 'customized';
    const finalColors = (colors && colors.length > 0) ? colors : ['Black'];
    const finalSizes = (sizes && sizes.length > 0) ? sizes : ['M'];

    // Upload images to Cloudinary in parallel
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

    // Create colorImages mapping and legacy images array
    const colorImages = uploadResults;
    const images = uploadResults.map(result => result.url);

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

    // Previous product creation (commented for reference)
    /*
    const newProduct = new Product({
      userId,
      name,
      description,
      category,
      price: Number(price),
      offerPrice: Number(offerPrice),
      images: images,
      date: Date.now()
    });
    */

    // Updated product creation with all new fields including colorImages
    const newProduct = new Product({
      userId,
      name,
      description,
      category,
      price: Number(price),
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      images: images, // Legacy field for backward compatibility
      colorImages: colorImages, // NEW: Color-aware images
      gender: finalGender,
      designType: finalDesignType,
      colors: finalColors,
      sizes: finalSizes,
      variants: variants,
      ratings: 4.3, // Default rating
      numOfReviews: 2, // Default number of reviews
      date: Date.now()
    });

    // SAVE THE PRODUCT TO DATABASE
    const savedProduct = await newProduct.save();
    console.log("Product saved successfully:", savedProduct); // Debug log

    return NextResponse.json({
      success: true,
      product: savedProduct,
      message: "Product added successfully."
    });

  } catch (error) {
    console.error("Error adding product:", error); // Debug log
    return NextResponse.json({
      success: false,
      message: error.message
    });
  }
}