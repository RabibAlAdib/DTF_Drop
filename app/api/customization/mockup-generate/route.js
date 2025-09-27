import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getUniversalAuth } from "@/lib/authUtil";
import connectDB from "@/config/db";
import CustomizationTemplate from "@/models/CustomizationTemplate";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

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
    const { templateId, selectedColor, userDesigns, view = 'front' } = data;
    
    // Validate required fields
    if (!templateId || !selectedColor || !userDesigns) {
      return NextResponse.json({
        success: false,
        message: "Template ID, color, and user designs are required"
      }, { status: 400 });
    }
    
    // Fetch template to get mockup images
    const template = await CustomizationTemplate.findById(templateId);
    if (!template) {
      return NextResponse.json({
        success: false,
        message: "Template not found"
      }, { status: 404 });
    }
    
    // Find the color's mockup images
    const colorInfo = template.availableColors.find(c => c.name === selectedColor);
    if (!colorInfo || !colorInfo.mockupImages) {
      return NextResponse.json({
        success: false,
        message: "Mockup images not found for selected color"
      }, { status: 400 });
    }
    
    // Handle both old array format and new object format for backward compatibility
    let mockupUrl;
    
    // Handle Mongoose Document arrays and regular arrays/objects
    if (colorInfo.mockupImages && colorInfo.mockupImages.constructor.name === 'Document') {
      // Legacy format: Mongoose Document array - convert to plain array
      const plainArray = colorInfo.mockupImages.toObject ? colorInfo.mockupImages.toObject() : colorInfo.mockupImages;
      mockupUrl = Array.isArray(plainArray) ? plainArray[0] : plainArray;
    } else if (Array.isArray(colorInfo.mockupImages) && colorInfo.mockupImages.length > 0) {
      // Legacy format: regular array of strings
      mockupUrl = colorInfo.mockupImages[0];
    } else if (typeof colorInfo.mockupImages === 'object' && colorInfo.mockupImages[view]) {
      // New format: object with view properties
      mockupUrl = colorInfo.mockupImages[view];
    }
    
    if (!mockupUrl) {
      return NextResponse.json({
        success: false,
        message: `Mockup image not found for ${view} view`
      }, { status: 400 });
    }
    
    // Build Cloudinary transformation for compositing designs
    const transformations = [];
    
    // Add the base mockup as the background
    const mockupPublicId = extractPublicIdFromUrl(mockupUrl);
    if (!mockupPublicId) {
      return NextResponse.json({
        success: false,
        message: "Invalid mockup image URL"
      }, { status: 400 });
    }
    
    // Process user designs for the current view
    const currentDesign = userDesigns[view];
    if (currentDesign && currentDesign.imageUrl) {
      const designPublicId = extractPublicIdFromUrl(currentDesign.imageUrl);
      if (designPublicId) {
        // Calculate position and size as percentages of the mockup dimensions
        const overlayTransform = {
          overlay: designPublicId,
          width: `${currentDesign.size.width}p`, // percentage of base image
          height: `${currentDesign.size.height}p`,
          x: `${currentDesign.position.x}p`, // percentage from left
          y: `${currentDesign.position.y}p`, // percentage from top
          gravity: 'north_west',
          crop: 'scale'
        };
        
        // Add rotation if specified
        if (currentDesign.rotation && currentDesign.rotation !== 0) {
          overlayTransform.angle = currentDesign.rotation;
        }
        
        transformations.push(overlayTransform);
      }
    }
    
    // Add additional designs for specific areas if this is the front/back view
    if (view === 'front' || view === 'back') {
      // Add sleeve design if present and this is front view
      if (view === 'front' && userDesigns.sleeve && userDesigns.sleeve.imageUrl) {
        const sleevePublicId = extractPublicIdFromUrl(userDesigns.sleeve.imageUrl);
        if (sleevePublicId) {
          transformations.push({
            overlay: sleevePublicId,
            width: `${userDesigns.sleeve.size.width}p`,
            height: `${userDesigns.sleeve.size.height}p`,
            x: `${userDesigns.sleeve.position.x}p`,
            y: `${userDesigns.sleeve.position.y}p`,
            gravity: 'north_west',
            crop: 'scale',
            angle: userDesigns.sleeve.rotation || 0
          });
        }
      }
      
      // Add pocket design if present and this is front view
      if (view === 'front' && userDesigns.pocket && userDesigns.pocket.imageUrl) {
        const pocketPublicId = extractPublicIdFromUrl(userDesigns.pocket.imageUrl);
        if (pocketPublicId) {
          transformations.push({
            overlay: pocketPublicId,
            width: `${userDesigns.pocket.size.width}p`,
            height: `${userDesigns.pocket.size.height}p`,
            x: `${userDesigns.pocket.position.x}p`,
            y: `${userDesigns.pocket.position.y}p`,
            gravity: 'north_west',
            crop: 'scale',
            angle: userDesigns.pocket.rotation || 0
          });
        }
      }
    }
    
    // Generate the preview image using Cloudinary's URL builder
    const previewUrl = cloudinary.url(mockupPublicId, {
      transformation: [
        { width: 800, height: 800, crop: 'limit', quality: 'auto:good' },
        ...transformations,
        { format: 'auto' }
      ],
      secure: true,
      sign_url: false // Make it publicly accessible for previews
    });
    
    // Generate a session token for tracking this preview
    const sessionToken = `preview_${userId}_${Date.now()}`;
    
    return NextResponse.json({
      success: true,
      previewUrl,
      sessionToken,
      view,
      message: "Preview generated successfully"
    });
    
  } catch (error) {
    console.error('Mockup generation error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to generate preview. Please try again."
    }, { status: 500 });
  }
}

// Helper function to extract public ID from Cloudinary URL
function extractPublicIdFromUrl(url) {
  try {
    // Extract public ID from Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload/' and before the file extension
    let publicIdPart = urlParts.slice(uploadIndex + 1).join('/');
    
    // Remove file extension
    const lastDotIndex = publicIdPart.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      publicIdPart = publicIdPart.substring(0, lastDotIndex);
    }
    
    // Split into segments
    const segments = publicIdPart.split('/');
    const cleanSegments = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Skip version segments (format: v1234567890)
      if (/^v\d+$/.test(segment)) {
        continue;
      }
      
      // Skip transformation parameters (format: c_scale,w_800, etc.)
      if (/^[a-z]_/.test(segment)) {
        continue;
      }
      
      // Keep everything else as part of the public ID
      cleanSegments.push(segment);
    }
    
    return cleanSegments.join('/');
  } catch (error) {
    console.error('Error extracting public ID from URL:', url, error);
    return null;
  }
}