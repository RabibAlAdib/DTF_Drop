import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

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
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({
        success: false,
        message: "No file provided"
      }, { status: 400 });
    }

    // Validate file size (max 10MB for Vercel optimization)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        message: "File size exceeds 10MB limit"
      }, { status: 400 });
    }

    // Convert file to buffer with memory optimization
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with optimized settings for production
    const uploadResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'products',
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
            console.error('Cloudinary upload error:', error);
            reject(new Error(`Upload failed: ${error.message}`));
          } else {
            resolve(result);
          }
        }
      );
      
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id
    });

  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to upload image"
    }, { status: 500 });
  }
}