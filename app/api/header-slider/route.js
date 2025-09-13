import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import HeaderSlider from '@/models/HeaderSlider';
import authSeller from '@/lib/authSeller';
import { v2 as cloudinary } from 'cloudinary';
import { isValidUrl } from './utils.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// GET - Fetch header slides (public for front-end display, seller-only for management)
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const visibleOnly = searchParams.get('visibleOnly') === 'true';
    const mineOnly = searchParams.get('mineOnly') === 'true';
    
    let query = {};
    let selectFields = 'title shortText productImage buyButtonText buyButtonAction buyButtonLink learnMoreButtonText learnMoreLink isVisible order createdAt';
    
    // For seller management view - show only current seller's slides
    if (mineOnly) {
      const { userId } = getAuth(request);
      if (!userId) {
        return NextResponse.json({
          success: false,
          message: "Authentication required"
        }, { status: 401 });
      }
      
      const isSeller = await authSeller(userId);
      if (!isSeller) {
        return NextResponse.json({
          success: false,
          message: "Unauthorized Access. Only Sellers can access this endpoint."
        }, { status: 403 });
      }
      
      query.userId = userId;
      selectFields += ' userId'; // Include userId for seller management
    } 
    // For public display - only visible slides, exclude sensitive data
    else if (visibleOnly) {
      query.isVisible = true;
      // Don't include userId for public display
    }
    // If neither flag is set, return error for security
    else {
      return NextResponse.json({
        success: false,
        message: "Invalid request. Please specify visibleOnly=true for public display or mineOnly=true for management."
      }, { status: 400 });
    }

    const slides = await HeaderSlider.find(query)
      .select(selectFields)
      .sort({ order: -1, createdAt: -1 }) // Newest first
      .lean();

    return NextResponse.json({
      success: true,
      slides: slides
    });

  } catch (error) {
    console.error('Get header slides error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch header slides"
    }, { status: 500 });
  }
}

// POST - Create new header slide (seller only)
export async function POST(request) {
  try {
    await connectDB();
    
    const { userId } = getAuth(request);
    
    // Check if user is a seller
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized Access. Only Sellers are allowed to add header slides."
      }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title');
    const shortText = formData.get('shortText');
    const productImageFile = formData.get('productImage');
    const buyButtonText = formData.get('buyButtonText') || 'Buy Now';
    const buyButtonAction = formData.get('buyButtonAction') || 'addToCart';
    const buyButtonLink = formData.get('buyButtonLink');
    const learnMoreButtonText = formData.get('learnMoreButtonText') || 'Learn More';
    const learnMoreLink = formData.get('learnMoreLink');
    const isVisible = formData.get('isVisible') === 'true';

    // Validate required fields
    if (!title || !shortText || !productImageFile || !learnMoreLink) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields (title, short text, product image, learn more link)."
      }, { status: 400 });
    }

    // Validate buy button configuration
    if (buyButtonAction === 'addToCart' && !buyButtonLink) {
      return NextResponse.json({
        success: false,
        message: "Product ID is required for 'Add to Cart' action."
      }, { status: 400 });
    }
    
    if (buyButtonAction === 'redirect' && (!buyButtonLink || !isValidUrl(buyButtonLink))) {
      return NextResponse.json({
        success: false,
        message: "Valid URL is required for redirect action."
      }, { status: 400 });
    }
    
    // Validate learn more link
    if (!isValidUrl(learnMoreLink)) {
      return NextResponse.json({
        success: false,
        message: "Valid Learn More URL is required."
      }, { status: 400 });
    }
    
    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({
        success: false,
        message: "Cloudinary configuration is missing. Please check your environment variables."
      }, { status: 500 });
    }

    // Upload image to Cloudinary
    const buffer = Buffer.from(await productImageFile.arrayBuffer());
    
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'header-slides',
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              public_id: result.public_id
            });
          }
        }
      );

      uploadStream.end(buffer);
    });

    const uploadResult = await uploadPromise;

    // Get the next order number (highest + 1)
    const maxOrderSlide = await HeaderSlider.findOne().sort({ order: -1 });
    const nextOrder = maxOrderSlide ? maxOrderSlide.order + 1 : 1;

    // Create new header slide
    const newSlide = new HeaderSlider({
      userId,
      title,
      shortText,
      productImage: uploadResult.url,
      buyButtonText,
      buyButtonAction,
      buyButtonLink,
      learnMoreButtonText,
      learnMoreLink,
      isVisible,
      order: nextOrder
    });

    await newSlide.save();

    return NextResponse.json({
      success: true,
      message: "Header slide created successfully!",
      slide: newSlide
    });

  } catch (error) {
    console.error("Error creating header slide:", error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}