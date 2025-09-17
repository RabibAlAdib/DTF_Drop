import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/authAdmin';

export async function POST(request) {
    try {
        // Check admin authentication
        const { userId, isAdmin, error } = await getAdminAuth(request);
        
        if (!userId || !isAdmin || error) {
            return NextResponse.json({
                success: false,
                message: error || 'Admin access required'
            }, { status: 403 });
        }

        const { key, value } = await request.json();

        if (!key || !value) {
            return NextResponse.json({
                success: false,
                message: 'Key and value are required'
            }, { status: 400 });
        }

        // Validate allowed keys
        const allowedKeys = [
            'CLERK_SECRET_KEY',
            'MONGODB_URI', 
            'CLOUDINARY_CLOUD_NAME',
            'CLOUDINARY_API_KEY',
            'CLOUDINARY_API_SECRET',
            'INNGEST_SIGNING_KEY',
            'INNGEST_EVENT_KEY',
            'EMAIL_HOST',
            'EMAIL_PORT',
            'EMAIL_USER', 
            'EMAIL_PASS',
            'BKASH_API_KEY',
            'BKASH_API_SECRET',
            'NAGAD_MERCHANT_ID',
            'NAGAD_PUBLIC_KEY'
        ];

        if (!allowedKeys.includes(key)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid API key name'
            }, { status: 400 });
        }

        // In a production environment, this would update environment variables
        // For now, we'll just simulate the update
        // Note: In Vercel, you would use the Vercel API to update environment variables
        
        // Log the update attempt (don't log sensitive values)
        console.log(`Admin ${userId} attempted to update ${key}`);

        return NextResponse.json({
            success: true,
            message: `${key} updated successfully`,
            note: 'In production, this would update the actual environment variable'
        });

    } catch (error) {
        console.error('Admin secret update error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to update secret'
        }, { status: 500 });
    }
}