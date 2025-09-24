import { v2 as cloudinary } from "cloudinary";
import { getSellerAuth } from '@/lib/authUtil';
import connectDB from "@/config/db";
import Offer from "@/models/Offer";
import Product from "@/models/Product"; // Import Product model for populate
import { NextResponse } from "next/server";

// Runtime configuration for handling large uploads
export const runtime = 'nodejs';
export const maxDuration = 30;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// GET - Fetch all active offers
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // banner, card, popup
    const activeOnly = searchParams.get('active') !== 'false';
    
    // Build query
    const query = {};
    if (activeOnly) {
      const now = new Date();
      query.isActive = true;
      query.validFrom = { $lte: now };
      query.validTo = { $gte: now };
    }
    
    if (type) {
      query.offerType = type;
    }

    const offers = await Offer.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .populate('applicableProducts', 'name price offerPrice images')
      .lean();

    // Transform offers for frontend
    const transformedOffers = offers.map(offer => ({
      ...offer,
      _id: offer._id.toString(),
      isCurrentlyValid: offer.isActive && 
                       offer.validFrom <= new Date() && 
                       offer.validTo >= new Date() &&
                       (!offer.usageLimit || offer.usedCount < offer.usageLimit),
      daysRemaining: Math.ceil((offer.validTo - new Date()) / (1000 * 60 * 60 * 24))
    }));

    return NextResponse.json({
      success: true,
      offers: transformedOffers
    });

  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch offers"
    }, { status: 500 });
  }
}

// POST - Create new offer
export async function POST(request) {
  try {
    const { userId, isSeller, error } = await getSellerAuth(request);
    
    if (!userId || !isSeller || error) {
      return NextResponse.json({
        success: false,
        message: error || "Unauthorized Access. Only Sellers are allowed to create offers."
      }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Extract form fields
    const title = formData.get('title');
    const description = formData.get('description');
    const discountType = formData.get('discountType');
    const discountValue = formData.get('discountValue');
    const validFrom = formData.get('validFrom');
    const validTo = formData.get('validTo');
    const offerCode = formData.get('offerCode');
    const minimumOrderValue = formData.get('minimumOrderValue');
    const usageLimit = formData.get('usageLimit');
    const offerType = formData.get('offerType');
    const priority = formData.get('priority');
    const category = formData.get('category');
    const showCountdown = formData.get('showCountdown') === 'true';
    const backgroundColor = formData.get('backgroundColor');
    const textColor = formData.get('textColor');
    const isActive = formData.get('isActive') !== 'false';
    
    // Handle applicable products (array)
    const applicableProducts = formData.getAll('applicableProducts');

    // Validate required fields
    if (!title || !description || !discountType || !discountValue || !validFrom || !validTo) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields."
      }, { status: 400 });
    }

    // Validate discount value
    const discount = Number(discountValue);
    if (isNaN(discount) || discount <= 0) {
      return NextResponse.json({
        success: false,
        message: "Discount value must be a valid number greater than 0."
      }, { status: 400 });
    }

    if (discountType === 'percentage' && discount > 100) {
      return NextResponse.json({
        success: false,
        message: "Percentage discount cannot exceed 100%."
      }, { status: 400 });
    }

    // Validate dates
    const startDate = new Date(validFrom);
    const endDate = new Date(validTo);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({
        success: false,
        message: "Please provide valid dates."
      }, { status: 400 });
    }
    if (endDate <= startDate) {
      return NextResponse.json({
        success: false,
        message: "End date must be after start date."
      }, { status: 400 });
    }
    if (startDate < new Date(Date.now() - 24 * 60 * 60 * 1000)) { // Allow up to 24 hours in the past
      return NextResponse.json({
        success: false,
        message: "Start date cannot be in the past."
      }, { status: 400 });
    }

    // Handle image upload if provided
    let offerImageUrl = null;
    const imageFile = formData.get('offerImage');
    
    if (imageFile && imageFile.size > 0) {
      // Validate file size (max 10MB)
      const maxFileSize = 10 * 1024 * 1024;
      if (imageFile.size > maxFileSize) {
        return NextResponse.json({
          success: false,
          message: "Image file is too large. Maximum size is 10MB."
        }, { status: 413 });
      }

      try {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { 
              resource_type: 'auto',
              folder: 'offers',
              transformation: [
                { width: 1200, height: 600, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(buffer);
        });
        
        offerImageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        return NextResponse.json({
          success: false,
          message: "Failed to upload image. Please try again."
        }, { status: 500 });
      }
    }

    await connectDB();

    // Check if offer code is unique (if provided)
    if (offerCode) {
      const existingOffer = await Offer.findOne({ 
        offerCode: offerCode.toUpperCase(),
        userId: { $ne: userId } // Exclude current user's offers
      });
      
      if (existingOffer) {
        return NextResponse.json({
          success: false,
          message: "This offer code is already in use. Please choose a different code."
        }, { status: 400 });
      }
    }

    // Create new offer
    const newOffer = new Offer({
      userId,
      title,
      description,
      discountType,
      discountValue: discount,
      validFrom: startDate,
      validTo: endDate,
      offerCode: offerCode ? offerCode.toUpperCase() : undefined,
      minimumOrderValue: minimumOrderValue ? Math.max(0, Number(minimumOrderValue) || 0) : 0,
      usageLimit: usageLimit ? Math.max(1, Number(usageLimit) || 0) : undefined,
      applicableProducts: applicableProducts.length > 0 ? applicableProducts : [],
      offerType: offerType || 'card',
      priority: Math.max(0, Math.min(10, Number(priority) || 0)),
      category: category || 'general',
      showCountdown,
      backgroundColor: backgroundColor || '#FF6B6B',
      textColor: textColor || '#FFFFFF',
      isActive,
      offerImage: offerImageUrl
    });

    const savedOffer = await newOffer.save();

    return NextResponse.json({
      success: true,
      offer: savedOffer,
      message: "Offer created successfully."
    });

  } catch (error) {
    console.error("Error creating offer:", error);
    
    const statusCode = error.message.includes('too large') ? 413 : 500;
    
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to create offer"
    }, { status: statusCode });
  }
}