import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/authAdmin';
import connectDB from '@/config/db';
import User from '@/models/User';

export async function GET(request) {
    try {
        // Check admin authentication
        const { userId, isAdmin, error } = await getAdminAuth(request);
        
        if (!userId || !isAdmin || error) {
            return NextResponse.json({
                success: false,
                message: error || 'Admin access required'
            }, { status: 403 });
        }

        await connectDB();

        // Get all users with basic info
        const users = await User.find({})
            .select('name email imageUrl joinDate role')
            .sort({ joinDate: -1 })
            .limit(100); // Limit to prevent overload

        return NextResponse.json({
            success: true,
            users
        });

    } catch (error) {
        console.error('Admin users fetch error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch users'
        }, { status: 500 });
    }
}