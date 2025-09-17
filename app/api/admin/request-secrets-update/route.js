import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/authAdmin';

export async function POST(request) {
    try {
        // Check admin authentication - CRITICAL SECURITY ENFORCEMENT
        const { userId, isAdmin, error } = await getAdminAuth(request);
        
        if (!userId || !isAdmin || error) {
            return NextResponse.json({
                success: false,
                message: error || 'Admin authentication required'
            }, { status: 403 });
        }

        const { secretKeys } = await request.json();

        if (!secretKeys || !Array.isArray(secretKeys)) {
            return NextResponse.json({
                success: false,
                message: 'secretKeys array is required'
            }, { status: 400 });
        }

        // SECURITY: Only log keys, never values
        console.log(`Admin ${userId} requested secure update of ${secretKeys.length} secrets:`, secretKeys.join(', '));

        return NextResponse.json({
            success: true,
            message: `Admin must use Replit Secrets panel to add ${secretKeys.length} secrets manually`,
            secretKeys: secretKeys,
            instructions: 'For security, secret values cannot be processed by the application. Use Replit Secrets panel directly.'
        });

    } catch (error) {
        console.error('Secret update request error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to process secret update request'
        }, { status: 500 });
    }
}