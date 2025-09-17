import { v2 as cloudinary } from "cloudinary";
import { getAuth } from '@clerk/nextjs/server';
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    
    // Check if user is a seller
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized Access. Only Sellers are allowed to delete images."
      }, { status: 401 });
    }

    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json({
        success: false,
        message: "Image URL is required"
      }, { status: 400 });
    }

    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
    const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const validCloudinaryPattern = new RegExp(`^https://res\\.cloudinary\\.com/${cloudinaryCloudName}/`);
    
    if (!validCloudinaryPattern.test(imageUrl)) {
      return NextResponse.json({
        success: false,
        message: "Invalid Cloudinary URL"
      }, { status: 400 });
    }

    // Extract public_id from URL
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
      return NextResponse.json({
        success: false,
        message: "Invalid Cloudinary URL format"
      }, { status: 400 });
    }

    // Get everything after 'upload/vXXXXXXXXX/' or 'upload/'
    let pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
    
    // Remove version number if present (starts with 'v' followed by digits)
    if (pathAfterUpload.match(/^v\d+\//)) {
      pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
    }
    
    // Remove file extension
    const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');

    // Security: Verify the image belongs to this seller
    await connectDB();
    
    // Check if this image URL exists in any product belonging to this seller
    const productWithImage = await Product.findOne({
      userId: userId,
      $or: [
        { images: imageUrl },
        { 'colorImages.url': imageUrl }
      ]
    });

    if (!productWithImage) {
      return NextResponse.json({
        success: false,
        message: "Image not found or you don't have permission to delete this image"
      }, { status: 403 });
    }

    // Delete image from Cloudinary
    const deleteResult = await cloudinary.uploader.destroy(publicId);

    if (deleteResult.result === 'ok') {
      return NextResponse.json({
        success: true,
        message: "Image deleted successfully",
        publicId: publicId
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Failed to delete image from Cloudinary",
        error: deleteResult.result
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to delete image"
    }, { status: 500 });
  }
}