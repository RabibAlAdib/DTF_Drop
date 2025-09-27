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
    
    // Debug logging for new preview-based structure
    console.log('Custom order request data:', {
      templateId: data.templateId,
      selectedColor: data.selectedColor,
      selectedSize: data.selectedSize,
      previewUrls: data.previewUrls,
      sessionToken: data.sessionToken,
      userEmail: data.userEmail
    });
    
    // Validate required fields for preview-based orders
    const { templateId, selectedColor, selectedSize, previewUrls, sessionToken, designTransforms } = data;
    
    if (!templateId || !selectedColor || !selectedSize || !previewUrls || !sessionToken) {
      console.log('Missing required fields:', { 
        templateId: !!templateId, 
        selectedColor: !!selectedColor, 
        selectedSize: !!selectedSize, 
        previewUrls: !!previewUrls,
        sessionToken: !!sessionToken
      });
      return NextResponse.json({
        success: false,
        message: "Template, color, size, preview URLs, and session token are required"
      }, { status: 400 });
    }
    
    // Validate that at least one preview URL exists
    if (!previewUrls.front && !previewUrls.back) {
      console.log('Validation failed - no preview URLs provided');
      return NextResponse.json({
        success: false,
        message: "At least one preview image (front or back) is required. Please generate preview images first."
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
    
    // Calculate extra images count based on design transforms
    let extraImagesCount = 0;
    if (designTransforms?.sleeve?.hasImage) extraImagesCount++;
    if (designTransforms?.pocket?.hasImage) extraImagesCount++;
    
    // Create WhatsApp link for high-quality file sharing
    const whatsappNumber = '+8801344823831';
    const orderReference = `CUSTOM_${Date.now()}_${userId.slice(-8)}`;
    const whatsappMessage = `Hi! I've placed a custom order (Ref: ${orderReference}) for ${template.category} in ${selectedColor}, size ${selectedSize}. Please find my high-quality design files attached for printing. Total: BDT ${sizeInfo.price + (extraImagesCount * template.extraImagePrice)}`;
    const whatsappLink = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Create order with new schema structure
    const order = new CustomOrder({
      userId,
      userEmail: data.userEmail,
      templateId,
      category: template.category,
      selectedColor,
      selectedSize,
      
      // New preview-based fields
      designTransforms: designTransforms || {
        front: { hasImage: !!previewUrls.front, position: { x: 50, y: 40 }, size: { width: 25, height: 30 }, rotation: 0 },
        back: { hasImage: !!previewUrls.back, position: { x: 50, y: 40 }, size: { width: 25, height: 30 }, rotation: 0 },
        sleeve: { hasImage: false, position: { x: 80, y: 30 }, size: { width: 12, height: 15 }, rotation: 0 },
        pocket: { hasImage: false, position: { x: 25, y: 35 }, size: { width: 8, height: 12 }, rotation: 0 }
      },
      previewUrls: {
        front: previewUrls.front || null,
        back: previewUrls.back || null
      },
      sessionToken,
      previewGeneratedAt: new Date(),
      
      // Pricing
      basePrice: sizeInfo.price,
      extraImagesCount,
      extraImagePrice: template.extraImagePrice,
      
      // WhatsApp integration
      whatsappLink,
      
      // Customer notes
      customerNotes: data.customerNotes || ''
    });
    
    await order.save();
    
    return NextResponse.json({
      success: true,
      message: "Custom order created successfully",
      order: {
        orderId: order.orderId,
        totalPrice: order.totalPrice,
        previewUrls: order.previewUrls,
        whatsappLink: order.whatsappLink,
        status: order.status
      },
      whatsappMessage: `Order ${order.orderId} created! Send your high-quality design files via WhatsApp for best printing quality.`,
      whatsappLink
    });
    
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to create order"
    }, { status: 500 });
  }
}