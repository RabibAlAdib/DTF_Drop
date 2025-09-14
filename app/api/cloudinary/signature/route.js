import { v2 as cloudinary } from "cloudinary";
import { getAuth } from '@clerk/nextjs/server';
import authSeller from "@/lib/authSeller";
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
        message: "Unauthorized Access. Only Sellers are allowed to upload images."
      }, { status: 401 });
    }

    // Generate timestamp for signature
    const timestamp = Math.round(Date.now() / 1000);
    
    // Define upload parameters
    const uploadParams = {
      timestamp: timestamp,
      folder: 'products',
      transformation: 'c_limit,w_800,h_800,q_auto,f_auto'
    };

    // Generate signature using Cloudinary's built-in method
    const signature = cloudinary.utils.api_sign_request(
      uploadParams, 
      process.env.CLOUDINARY_API_SECRET
    );

    // Return signature and upload parameters to frontend
    return NextResponse.json({
      success: true,
      signature: signature,
      timestamp: timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      upload_params: uploadParams
    });

  } catch (error) {
    console.error("Error generating Cloudinary signature:", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to generate upload signature"
    }, { status: 500 });
  }
}