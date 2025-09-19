import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Offer from '@/models/Offer';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const active = searchParams.get('active');

    // Build filter query
    let filter = {};
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (active === 'true') {
      filter.active = true;
      // Also filter by date range if specified
      const now = new Date();
      filter.$or = [
        { validUntil: { $exists: false } }, // No expiry date
        { validUntil: { $gte: now } } // Not expired
      ];
    }

    const offers = await Offer.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .lean(); // Use lean for better performance

    return NextResponse.json({
      success: true,
      offers: offers
    });

  } catch (error) {
    console.error('Error fetching public offers:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch offers'
    }, { status: 500 });
  }
}
