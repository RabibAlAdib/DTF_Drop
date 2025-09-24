import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getUniversalAuth } from "@/lib/authUtil";
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
    // Authenticate user
    const { userId, error } = await getUniversalAuth(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User not authenticated"
      }, { status: 401 });
    }

    // Check seller authorization
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "Seller authorization required"
      }, { status: 403 });
    }

    const body = await request.json();
    const { params_to_sign } = body;

    if (!params_to_sign) {
      return NextResponse.json({
        success: false,
        message: "Missing parameters to sign"
      }, { status: 400 });
    }

    // Validate upload parameters - only allow products folder
    if (params_to_sign.folder && !params_to_sign.folder.startsWith('products')) {
      return NextResponse.json({
        success: false,
        message: "Invalid upload folder"
      }, { status: 400 });
    }

    // Generate signature for Cloudinary upload
    const signature = cloudinary.utils.api_sign_request(
      params_to_sign,
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      success: true,
      signature,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME
    });

  } catch (error) {
    console.error("Error generating Cloudinary signature:", error);
    
    return NextResponse.json({
      success: false,
      message: "Failed to generate signature"
    }, { status: 500 });
  }
}