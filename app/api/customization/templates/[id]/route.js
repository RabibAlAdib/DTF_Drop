import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import CustomizationTemplate from "@/models/CustomizationTemplate";
import { getAuth } from '@clerk/nextjs/server';
import authSeller from "@/lib/authSeller";

// GET - Fetch specific template by ID
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const template = await CustomizationTemplate.findById(params.id);
    
    if (!template) {
      return NextResponse.json({
        success: false,
        message: "Template not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      template
    });
    
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch template"
    }, { status: 500 });
  }
}

// PUT - Update template (Admin only)
export async function PUT(request, { params }) {
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
    
    const isSellerAuth = await authSeller(request);
    if (!isSellerAuth) {
      return NextResponse.json({
        success: false,
        message: "Seller access required"
      }, { status: 403 });
    }
    
    const data = await request.json();
    
    const template = await CustomizationTemplate.findByIdAndUpdate(
      params.id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!template) {
      return NextResponse.json({
        success: false,
        message: "Template not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Template updated successfully",
      template
    });
    
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to update template"
    }, { status: 500 });
  }
}

// DELETE - Delete template (Admin only)
export async function DELETE(request, { params }) {
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
    
    const isSellerAuth = await authSeller(request);
    if (!isSellerAuth) {
      return NextResponse.json({
        success: false,
        message: "Seller access required"
      }, { status: 403 });
    }
    
    const template = await CustomizationTemplate.findByIdAndDelete(params.id);
    
    if (!template) {
      return NextResponse.json({
        success: false,
        message: "Template not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Template deleted successfully"
    });
    
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete template"
    }, { status: 500 });
  }
}