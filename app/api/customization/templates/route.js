import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import CustomizationTemplate from "@/models/CustomizationTemplate";
import { getAuth } from '@clerk/nextjs/server';
import authSeller from "@/lib/authSeller";

// GET - Fetch all active customization templates
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let query = { isActive: true };
    if (category) {
      query.category = category;
    }
    
    const templates = await CustomizationTemplate.find(query)
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      templates
    });
    
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch templates"
    }, { status: 500 });
  }
}

// POST - Create new customization template (Admin only)
export async function POST(request) {
  try {
    await connectDB();
    
    // Authenticate and check seller role
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "Authentication required"
      }, { status: 401 });
    }
    
    const isSellerAuth = await authSeller(userId);
    if (!isSellerAuth) {
      return NextResponse.json({
        success: false,
        message: "Seller access required"
      }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    const { name, category, description, availableColors, availableSizes, basePrice } = data;
    
    if (!name || !category || !description || !availableColors || !availableSizes || !basePrice) {
      return NextResponse.json({
        success: false,
        message: "All required fields must be provided"
      }, { status: 400 });
    }
    
    // Create new template
    const template = new CustomizationTemplate({
      ...data,
      createdBy: userId
    });
    
    await template.save();
    
    return NextResponse.json({
      success: true,
      message: "Template created successfully",
      template
    });
    
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to create template"
    }, { status: 500 });
  }
}