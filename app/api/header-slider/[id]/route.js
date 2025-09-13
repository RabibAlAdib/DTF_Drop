import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import HeaderSlider from '@/models/HeaderSlider';
import authSeller from '@/lib/authSeller';
import { isValidUrl } from '../utils.js';

// PUT - Update header slide visibility (seller only)
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { userId } = getAuth(request);
    const { id } = params;
    
    // Check if user is a seller
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized Access. Only Sellers are allowed to update header slides."
      }, { status: 403 });
    }

    const body = await request.json();
    const { isVisible, title, shortText, buyButtonText, learnMoreButtonText, learnMoreLink, buyButtonLink, buyButtonAction } = body;

    // Validate URLs if provided
    if (learnMoreLink && !isValidUrl(learnMoreLink)) {
      return NextResponse.json({
        success: false,
        message: "Valid Learn More URL is required (http/https only)."
      }, { status: 400 });
    }
    
    if (buyButtonAction === 'redirect' && buyButtonLink && !isValidUrl(buyButtonLink)) {
      return NextResponse.json({
        success: false,
        message: "Valid redirect URL is required (http/https only)."
      }, { status: 400 });
    }

    // Find the slide and check ownership
    const slide = await HeaderSlider.findById(id);
    if (!slide) {
      return NextResponse.json({
        success: false,
        message: "Header slide not found"
      }, { status: 404 });
    }

    if (slide.userId !== userId) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized. You can only update your own slides."
      }, { status: 403 });
    }

    // Update the slide
    const updateData = { updatedAt: new Date() };
    if (typeof isVisible === 'boolean') updateData.isVisible = isVisible;
    if (title) updateData.title = title;
    if (shortText) updateData.shortText = shortText;
    if (buyButtonText) updateData.buyButtonText = buyButtonText;
    if (learnMoreButtonText) updateData.learnMoreButtonText = learnMoreButtonText;
    if (learnMoreLink) updateData.learnMoreLink = learnMoreLink;
    if (buyButtonAction) updateData.buyButtonAction = buyButtonAction;
    if (buyButtonLink) updateData.buyButtonLink = buyButtonLink;

    const updatedSlide = await HeaderSlider.findByIdAndUpdate(id, updateData, { new: true });

    return NextResponse.json({
      success: true,
      message: "Header slide updated successfully!",
      slide: updatedSlide
    });

  } catch (error) {
    console.error("Error updating header slide:", error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// DELETE - Delete header slide (seller only)
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { userId } = getAuth(request);
    const { id } = params;
    
    // Check if user is a seller
    const isSeller = await authSeller(userId);
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized Access. Only Sellers are allowed to delete header slides."
      }, { status: 403 });
    }

    // Find the slide and check ownership
    const slide = await HeaderSlider.findById(id);
    if (!slide) {
      return NextResponse.json({
        success: false,
        message: "Header slide not found"
      }, { status: 404 });
    }

    if (slide.userId !== userId) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized. You can only delete your own slides."
      }, { status: 403 });
    }

    await HeaderSlider.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Header slide deleted successfully!"
    });

  } catch (error) {
    console.error("Error deleting header slide:", error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}