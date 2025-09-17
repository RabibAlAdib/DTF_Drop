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

        // Get all users with basic info including username from Clerk
        const dbUsers = await User.find({})
            .select('name email imageUrl joinDate role')
            .sort({ joinDate: -1 })
            .limit(100);

        // Enhance with Clerk data to get usernames
        const usersWithClerkData = await Promise.all(
            dbUsers.map(async (dbUser) => {
                try {
                    const clerkUser = await clerkClient.users.getUser(dbUser._id);
                    return {
                        ...dbUser.toObject(),
                        username: clerkUser.username,
                        clerkId: clerkUser.id
                    };
                } catch (error) {
                    // If Clerk user not found, return basic info
                    return {
                        ...dbUser.toObject(),
                        username: 'unknown',
                        clerkId: dbUser._id
                    };
                }
            })
        );

        return NextResponse.json({
            success: true,
            users: usersWithClerkData
        });

    } catch (error) {
        console.error('Admin users fetch error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch users'
        }, { status: 500 });
    }
}