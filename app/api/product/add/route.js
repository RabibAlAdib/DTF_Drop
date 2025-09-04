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
    const files = formData.getAll('images');
    
    // NEW: Get color and size data
    const colors = formData.getAll('colors');
    const sizes = formData.getAll('sizes');

    // Validate required fields
    if (!name || !description || !category || !price) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields."
      });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Please upload at least one image."
      });
    }

    // NEW: Validate colors and sizes
    if (!colors || colors.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Please select at least one color."
      });
    }

    if (!sizes || sizes.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Please select at least one size."
      });
    }

    // Upload images to Cloudinary
    const result = await Promise.all(
      files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          stream.end(buffer);
        });
      })
    );

    const images = result.map(result => result.secure_url);

    // Connect to database
    await connectDB();

    // NEW: Generate variants for each color-size combination
    const variants = [];
    colors.forEach(color => {
      sizes.forEach(size => {
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

    // Updated product creation with variants
    const newProduct = new Product({
      userId,
      name,
      description,
      category,
      price: Number(price),
      offerPrice: offerPrice ? Number(offerPrice) : undefined,
      images: images,
      colors: colors,
      sizes: sizes,
      variants: variants,
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