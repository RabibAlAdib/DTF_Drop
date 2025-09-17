import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/authAdmin';
import { clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';

export async function DELETE(request, { params }) {
    try {
        // Check admin authentication
        const { userId, isAdmin, error } = await getAdminAuth(request);
        
        if (!userId || !isAdmin || error) {
            return NextResponse.json({
                success: false,
                message: error || 'Admin access required'
            }, { status: 403 });
        }

        const { id: targetUserId } = params;

        if (!targetUserId) {
            return NextResponse.json({
                success: false,
                message: 'User ID is required'
            }, { status: 400 });
        }

        // Prevent admin from deleting themselves or dtfdrop_admin
        if (targetUserId === userId) {
            return NextResponse.json({
                success: false,
                message: 'Cannot delete your own account'
            }, { status: 403 });
        }

        // Check if target user is dtfdrop_admin
        const targetUser = await clerkClient.users.getUser(targetUserId);
        const adminUsername = 'dtfdrop_admin';
        const adminUserId = process.env.ADMIN_USER_ID;
        const isTargetAdmin = targetUser.username === adminUsername || 
                             (adminUserId && targetUserId === adminUserId);
        
        if (isTargetAdmin) {
            return NextResponse.json({
                success: false,
                message: 'Cannot delete admin user'
            }, { status: 403 });
        }

        await connectDB();

        // Delete user's related data
        await Promise.all([
            // Delete user's products
            Product.deleteMany({ sellerId: targetUserId }),
            // Delete user's orders  
            Order.deleteMany({ userId: targetUserId }),
            // Delete user from our database
            User.findByIdAndDelete(targetUserId)
        ]);

        // Delete user from Clerk
        await clerkClient.users.deleteUser(targetUserId);

        console.log(`Admin ${userId} deleted user ${targetUserId}`);

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Admin user deletion error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to delete user'
        }, { status: 500 });
    }
}