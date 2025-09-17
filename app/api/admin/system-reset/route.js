import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/authAdmin';
import connectDB from '@/config/db';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';
import CustomOrder from '@/models/CustomOrder';
import CustomizationTemplate from '@/models/CustomizationTemplate';

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

        await connectDB();

        // Get admin user details to preserve
        const adminUser = await User.findById(userId);

        // Clear all data except admin user
        await Promise.all([
            // Delete all products
            Product.deleteMany({}),
            // Delete all orders
            Order.deleteMany({}),
            // Delete all custom orders
            CustomOrder.deleteMany({}),
            // Delete all customization templates
            CustomizationTemplate.deleteMany({}),
            // Delete all users except admin
            User.deleteMany({ _id: { $ne: userId } })
        ]);

        // Reset admin user cart and other data
        if (adminUser) {
            adminUser.cartItems = {};
            await adminUser.save();
        }

        console.log(`Admin ${userId} performed system reset`);

        return NextResponse.json({
            success: true,
            message: 'System reset successfully. All data cleared except admin user.'
        });

    } catch (error) {
        console.error('Admin system reset error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to reset system'
        }, { status: 500 });
    }
}