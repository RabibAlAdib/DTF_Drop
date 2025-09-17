import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Offer from '@/models/Offer';

export async function POST(request) {
    try {
        const { promoCode } = await request.json();
        
        if (!promoCode || typeof promoCode !== 'string') {
            return NextResponse.json({
                success: false,
                message: 'Promo code is required'
            }, { status: 400 });
        }

        await connectDB();

        // Find active offer with matching code
        const offer = await Offer.findOne({
            offerCode: promoCode.toUpperCase().trim(),
            isActive: true,
            validFrom: { $lte: new Date() },
            validTo: { $gte: new Date() }
        });

        if (!offer) {
            return NextResponse.json({
                success: false,
                message: 'Invalid or expired promo code',
                offer: null
            });
        }

        // Check usage limit
        if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
            return NextResponse.json({
                success: false,
                message: 'This promo code has reached its usage limit',
                offer: null
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Valid promo code',
            offer: {
                _id: offer._id,
                title: offer.title,
                description: offer.description,
                discountType: offer.discountType,
                discountValue: offer.discountValue,
                minimumOrderValue: offer.minimumOrderValue,
                offerCode: offer.offerCode,
                validFrom: offer.validFrom,
                validTo: offer.validTo,
                usageLimit: offer.usageLimit,
                usedCount: offer.usedCount,
                isActive: offer.isActive
            }
        });

    } catch (error) {
        console.error('Promo validation error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to validate promo code'
        }, { status: 500 });
    }
}