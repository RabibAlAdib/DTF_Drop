import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getUniversalAuth } from "@/lib/authUtil";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function POST(request) {
  try {
    // Authenticate user (not requiring seller permissions for custom designs)
    const { userId, error } = await getUniversalAuth(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User authentication required"
      }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({
        success: false,
        message: "No file provided"
      }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: "Invalid file type. Please upload JPEG, PNG, or WebP images only"
      }, { status: 400 });
    }

    // Validate file size (max 2MB for custom designs to optimize performance)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        message: "File size exceeds 2MB limit. Please compress your image"
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with optimized settings for custom designs
    const uploadResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'custom-designs',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:good' },
            { format: 'auto' }
          ],
          resource_type: 'image',
          timeout: 30000,
          public_id: `${userId}_${Date.now()}` // Include user ID for organization
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
    console.error("Error uploading custom design:", error);
    
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to upload custom design"
    }, { status: 500 });
  }
}