import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/config/db';
import HeaderSlider from '@/models/HeaderSlider';
import { authSeller } from '@/lib/authSeller';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

await connectDB();

// GET - Fetch all header slides (for front-end display)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const visibleOnly = searchParams.get('visibleOnly') === 'true';
    
    let query = {};
    if (visibleOnly) {
      query.isVisible = true;
    }

    const slides = await HeaderSlider.find(query)
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

    // Upload image to Cloudinary
    const buffer = Buffer.from(await productImageFile.arrayBuffer());
    
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
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