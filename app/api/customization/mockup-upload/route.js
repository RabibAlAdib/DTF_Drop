import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getAuth } from '@clerk/nextjs/server';
import authSeller from "@/lib/authSeller";

// Configure Cloudinary with error handling for missing env vars
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary environment variables');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function POST(request) {
  try {
    // Optimized authentication for Vercel deployment
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Authentication required"
      }, { status: 401 });
    }
    
    const isSellerAuth = await authSeller(userId);
    if (!isSellerAuth) {
      return NextResponse.json({
        success: false,
        message: "Seller/Admin access required"
      }, { status: 403 });
    }
    
    const formData = await request.formData();
    let files = formData.getAll('files');
    
    // Handle single file upload as well
    if (files.length === 0) {
      const singleFile = formData.get('file');
      if (singleFile) {
        files = [singleFile];
      }
    }
    
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No files provided"
      }, { status: 400 });
    }

    // Limit to 10 images as requested
    if (files.length > 10) {
      return NextResponse.json({
        success: false,
        message: "Maximum 10 images allowed"
      }, { status: 400 });
    }

    // Process uploads with better error handling and optimization for Vercel
    const uploadPromises = files.map(async (file, index) => {
      try {
        if (!file || file.size === 0) {
          throw new Error(`Invalid file at index ${index}`);
        }

        // Validate file size (max 10MB for Vercel optimization)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          throw new Error(`File at index ${index} exceeds 10MB limit`);
        }

        // Convert file to buffer with memory optimization
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary with optimized settings for production
        const uploadResponse = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'customization/mockups',
              transformation: [
                { width: 800, height: 800, crop: 'limit' }, // Optimized for performance
                { quality: 'auto:good' },
                { format: 'auto' }
              ],
              resource_type: 'image',
              timeout: 30000 // 30 second timeout for Vercel
            },
            (error, result) => {
              if (error) {
                console.error(`Upload error for file ${index}:`, error);
                reject(new Error(`Upload failed for file ${index}: ${error.message}`));
              } else {
                resolve(result);
              }
            }
          );
          
          uploadStream.end(buffer);
        });

        return {
          url: uploadResponse.secure_url,
          public_id: uploadResponse.public_id,
          originalName: file.name,
          size: uploadResponse.bytes,
          format: uploadResponse.format
        };
      } catch (fileError) {
        console.error(`Error processing file ${index}:`, fileError);
        throw new Error(`Failed to process file ${index}: ${fileError.message}`);
      }
    });

    const uploadResults = await Promise.all(uploadPromises);

    return NextResponse.json({
      success: true,
      message: `${uploadResults.length} mockup images uploaded successfully`,
      images: uploadResults
    });

  } catch (error) {
    console.error("Error uploading mockup images:", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to upload mockup images",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}