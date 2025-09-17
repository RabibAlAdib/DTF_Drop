import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/authAdmin';
import { clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';

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

        const { userId: targetUserId, role } = await request.json();

        if (!targetUserId || !role) {
            return NextResponse.json({
                success: false,
                message: 'User ID and role are required'
            }, { status: 400 });
        }

        // Validate role
        const allowedRoles = ['user', 'seller'];
        if (!allowedRoles.includes(role)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid role. Allowed roles: user, seller'
            }, { status: 400 });
        }

        await connectDB();
        
        // Get target user details
        const targetUser = await clerkClient.users.getUser(targetUserId);
        
        // Prevent admin from changing their own role or dtfdrop_admin role
        const adminUsername = 'dtfdrop_admin';
        const adminUserId = process.env.ADMIN_USER_ID;
        const isTargetAdmin = targetUser.username === adminUsername || 
                             (adminUserId && targetUserId === adminUserId);
        
        if (isTargetAdmin) {
            return NextResponse.json({
                success: false,
                message: 'Cannot modify admin user role'
            }, { status: 403 });
        }

        // Update role in Clerk's public metadata
        await clerkClient.users.updateUser(targetUserId, {
            publicMetadata: {
                ...targetUser.publicMetadata,
                role: role
            }
        });

        // Update role in our database
        await User.findByIdAndUpdate(targetUserId, { 
            role: role 
        }, { 
            upsert: true,
            new: true 
        });

        console.log(`Admin ${userId} updated user ${targetUserId} role to ${role}`);

        return NextResponse.json({
            success: true,
            message: 'User role updated successfully'
        });

    } catch (error) {
        console.error('Admin user role update error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to update user role'
        }, { status: 500 });
    }
}