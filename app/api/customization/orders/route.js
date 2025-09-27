import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import CustomOrder from "@/models/CustomOrder";
import CustomizationTemplate from "@/models/CustomizationTemplate";
import { getUniversalAuth } from '@/lib/authUtil';

// GET - Fetch user's custom orders
export async function GET(request) {
  try {
    await connectDB();
    
    const { userId, error } = await getUniversalAuth(request);
    if (!userId || error) {
      return NextResponse.json({
        success: false,
        message: "Authentication required"
      }, { status: 401 });
    }
    
    const orders = await CustomOrder.find({ userId })
      .populate('templateId')
      .sort({ orderDate: -1 });
    
    return NextResponse.json({
      success: true,
      orders
    });
    
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch orders"
    }, { status: 500 });
  }
}

// POST - Create new custom order
export async function POST(request) {
  try {
    await connectDB();
    
    const { userId, error } = await getUniversalAuth(request);
    if (!userId || error) {
      return NextResponse.json({
        success: false,
        message: "Authentication required"
      }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Debug logging to see what's being received
    console.log('Custom order request data:', {
      templateId: data.templateId,
      selectedColor: data.selectedColor,
      selectedSize: data.selectedSize,
      userDesigns: data.userDesigns,
      userEmail: data.userEmail
    });
    
    // Validate required fields
    const { templateId, selectedColor, selectedSize, userDesigns } = data;
    
    if (!templateId || !selectedColor || !selectedSize || !userDesigns) {
      console.log('Missing required fields:', { templateId: !!templateId, selectedColor: !!selectedColor, selectedSize: !!selectedSize, userDesigns: !!userDesigns });
      return NextResponse.json({
        success: false,
        message: "All required fields must be provided"
      }, { status: 400 });
    }
    
    // Debug the userDesigns structure
    console.log('UserDesigns validation:', {
      frontImageUrl: userDesigns.front?.imageUrl,
      backImageUrl: userDesigns.back?.imageUrl,
      frontExists: !!userDesigns.front?.imageUrl,
      backExists: !!userDesigns.back?.imageUrl
    });
    
    // Validate that both front and back designs are provided for final image creation
    if (!userDesigns.front?.imageUrl || !userDesigns.back?.imageUrl) {
      console.log('Validation failed - missing front or back design URLs');
      return NextResponse.json({
        success: false,
        message: "Both front and back designs are required. Please upload designs for both front and back areas before creating your order."
      }, { status: 400 });
    }
    
    // Fetch template to get pricing
    const template = await CustomizationTemplate.findById(templateId);
    if (!template) {
      return NextResponse.json({
        success: false,
        message: "Template not found"
      }, { status: 404 });
    }
    
    // Find size pricing
    const sizeInfo = template.availableSizes.find(s => s.size === selectedSize);
    if (!sizeInfo) {
      return NextResponse.json({
        success: false,
        message: "Invalid size selected"
      }, { status: 400 });
    }
    
    // Validate selected color exists in template
    const colorInfo = template.availableColors.find(c => c.name === selectedColor);
    if (!colorInfo) {
      return NextResponse.json({
        success: false,
        message: "Invalid color selected"
      }, { status: 400 });
    }
    
    // Calculate extra images count (excluding front and back)
    let extraImagesCount = 0;
    if (userDesigns.sleeve?.imageUrl) extraImagesCount++;
    if (userDesigns.pocket?.imageUrl) extraImagesCount++;
    
    // Create order
    const order = new CustomOrder({
      userId,
      userEmail: data.userEmail,
      templateId,
      category: template.category,
      selectedColor,
      selectedSize,
      userDesigns,
      basePrice: sizeInfo.price,
      extraImagesCount,
      extraImagePrice: template.extraImagePrice,
      customerNotes: data.customerNotes || ''
    });
    
    await order.save();
    
    return NextResponse.json({
      success: true,
      message: "Custom order created successfully",
      order,
      whatsappMessage: `Please send your design files via WhatsApp for better quality printing. Order ID: ${order.orderId}`
    });
    
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to create order"
    }, { status: 500 });
  }
}