import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getAuth } from '@clerk/nextjs/server';
import authSeller from "@/lib/authSeller";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function POST(request) {
  try {
    // Require authentication for security
    const { getAuth } = await import('@clerk/nextjs/server');
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

    const uploadPromises = files.map(async (file, index) => {
      if (!file || file.size === 0) {
        throw new Error(`Invalid file at index ${index}`);
      }

      // Convert file to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Upload to Cloudinary with optimization
      const uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'customization/mockups',
            transformation: [
              { width: 1000, height: 1000, crop: 'limit' }, // High quality
              { quality: 'auto:good' }, // Good quality, optimized size
              { format: 'auto' }, // Auto format selection
              { fetch_format: 'auto' } // Auto fetch format
            ],
            resource_type: 'image'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      return {
        url: uploadResponse.secure_url,
        public_id: uploadResponse.public_id,
        originalName: file.name,
        size: uploadResponse.bytes,
        format: uploadResponse.format
      };
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