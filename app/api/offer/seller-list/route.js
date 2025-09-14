import { getSellerAuth } from '@/lib/authUtil';
import connectDB from "@/config/db";
import Offer from "@/models/Offer";
import { NextResponse } from "next/server";

// GET - Fetch offers for a specific seller
export async function GET(request) {
  try {
    const { userId, isSeller, error } = await getSellerAuth(request);
    
    if (!userId || !isSeller || error) {
      return NextResponse.json({
        success: false,
        message: error || "Unauthorized Access. Only Sellers are allowed to view their offers."
      }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'expired', 'all'
    const type = searchParams.get('type'); // 'banner', 'card', 'popup'
    const category = searchParams.get('category');
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit')) || 10), 50); // Max 50 per page, min 1
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Build query for seller's offers
    const query = { userId };
    const now = new Date();

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
      query.validFrom = { $lte: now };
      query.validTo = { $gte: now };
    } else if (status === 'expired') {
      query.$or = [
        { isActive: false },
        { validTo: { $lt: now } }
      ];
    }

    // Filter by type
    if (type) {
      query.offerType = type;
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Get total count for pagination
    const total = await Offer.countDocuments(query);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Fetch offers with pagination
    const offers = await Offer.find(query)
      .populate('applicableProducts', 'name price offerPrice images')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform offers with computed fields
    const transformedOffers = offers.map(offer => {
      const isCurrentlyValid = offer.isActive && 
                              offer.validFrom <= now && 
                              offer.validTo >= now &&
                              (!offer.usageLimit || offer.usedCount < offer.usageLimit);
      
      const isExpired = now > offer.validTo;
      const daysRemaining = Math.ceil((offer.validTo - now) / (1000 * 60 * 60 * 24));
      
      return {
        ...offer,
        _id: offer._id.toString(),
        isCurrentlyValid,
        isExpired,
        daysRemaining,
        // Calculate usage percentage
        usagePercentage: offer.usageLimit ? 
          Math.round((offer.usedCount / offer.usageLimit) * 100) : 0
      };
    });

    // Calculate statistics
    const stats = {
      total,
      active: transformedOffers.filter(o => o.isCurrentlyValid).length,
      expired: transformedOffers.filter(o => o.isExpired).length,
      inactive: transformedOffers.filter(o => !o.isActive).length
    };

    return NextResponse.json({
      success: true,
      offers: transformedOffers,
      pagination: {
        currentPage: page,
        totalPages,
        total,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      stats
    });

  } catch (error) {
    console.error("Error fetching seller offers:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch offers"
    }, { status: 500 });
  }
}