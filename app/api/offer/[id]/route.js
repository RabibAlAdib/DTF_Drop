import { v2 as cloudinary } from "cloudinary";
import { getSellerAuth } from '@/lib/authUtil';
import connectDB from "@/config/db";
import Offer from "@/models/Offer";
import { NextResponse } from "next/server";

// Runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 30;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// GET - Fetch single offer
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    const offer = await Offer.findById(id)
      .populate('applicableProducts', 'name price offerPrice images')
      .lean();

    if (!offer) {
      return NextResponse.json({
        success: false,
        message: "Offer not found"
      }, { status: 404 });
    }

    // Add computed fields
    const now = new Date();
    const transformedOffer = {
      ...offer,
      _id: offer._id.toString(),
      isCurrentlyValid: offer.isActive && 
                       offer.validFrom <= now && 
                       offer.validTo >= now &&
                       (!offer.usageLimit || offer.usedCount < offer.usageLimit),
      isExpired: now > offer.validTo,
      daysRemaining: Math.ceil((offer.validTo - now) / (1000 * 60 * 60 * 24))
    };

    return NextResponse.json({
      success: true,
      offer: transformedOffer
    });

  } catch (error) {
    console.error("Error fetching offer:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch offer"
    }, { status: 500 });
  }
}

// PUT - Update existing offer
export async function PUT(request, { params }) {
  try {
    const { userId, isSeller, error } = await getSellerAuth(request);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Authentication required."
      }, { status: 401 });
    }
    
    // Check if user is admin first
    const { isAdminUser } = await import('@/lib/authAdmin');
    const isAdmin = await isAdminUser(request);
    
    if (!isAdmin && (!isSeller || error)) {
      return NextResponse.json({
        success: false,
        message: error || "Unauthorized Access. Only Sellers are allowed to update offers."
      }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    
    await connectDB();

    // Find existing offer and verify ownership
    const existingOffer = await Offer.findById(id);
    if (!existingOffer) {
      return NextResponse.json({
        success: false,
        message: "Offer not found"
      }, { status: 404 });
    }

    // Check if admin or owner can update
    if (!isAdmin && String(existingOffer.userId) !== String(userId)) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized. You can only update your own offers."
      }, { status: 403 });
    }

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
    
    // Handle applicable products
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

    // Handle image upload if provided
    let offerImageUrl = existingOffer.offerImage;
    const imageFile = formData.get('offerImage');
    const removeImage = formData.get('removeImage') === 'true';
    
    if (removeImage) {
      offerImageUrl = null;
    } else if (imageFile && imageFile.size > 0) {
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

    // Check if offer code is unique (if changed)
    if (offerCode && offerCode.toUpperCase() !== existingOffer.offerCode) {
      const duplicateOffer = await Offer.findOne({ 
        offerCode: offerCode.toUpperCase(),
        _id: { $ne: id },
        userId: { $ne: userId }
      });
      
      if (duplicateOffer) {
        return NextResponse.json({
          success: false,
          message: "This offer code is already in use. Please choose a different code."
        }, { status: 400 });
      }
    }

    // Update offer
    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      {
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
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
      message: "Offer updated successfully."
    });

  } catch (error) {
    console.error("Error updating offer:", error);
    
    const statusCode = error.message.includes('too large') ? 413 : 500;
    
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to update offer"
    }, { status: statusCode });
  }
}

// DELETE - Delete offer
export async function DELETE(request, { params }) {
  try {
    const { userId, isSeller, error } = await getSellerAuth(request);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Authentication required."
      }, { status: 401 });
    }
    
    // Check if user is admin first
    const { isAdminUser } = await import('@/lib/authAdmin');
    const isAdmin = await isAdminUser(request);
    
    if (!isAdmin && (!isSeller || error)) {
      return NextResponse.json({
        success: false,
        message: error || "Unauthorized Access. Only Sellers are allowed to delete offers."
      }, { status: 401 });
    }

    const { id } = params;
    
    await connectDB();

    // Find existing offer and verify ownership
    const existingOffer = await Offer.findById(id);
    if (!existingOffer) {
      return NextResponse.json({
        success: false,
        message: "Offer not found"
      }, { status: 404 });
    }

    // Check if admin or owner can delete
    if (!isAdmin && String(existingOffer.userId) !== String(userId)) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized. You can only delete your own offers."
      }, { status: 403 });
    }

    // Delete the offer
    await Offer.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Offer deleted successfully."
    });

  } catch (error) {
    console.error("Error deleting offer:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete offer"
    }, { status: 500 });
  }
}