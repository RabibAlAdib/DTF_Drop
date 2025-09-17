import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/authAdmin';
import connectDB from '@/config/db';
import User from '@/models/User';
import Product from '@/models/Product';
import Order from '@/models/Order';

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

        // Get system statistics
        const [totalUsers, totalProducts, totalOrders, totalSellers] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(), 
            Order.countDocuments(),
            User.countDocuments({ role: 'seller' })
        ]);

        return NextResponse.json({
            success: true,
            stats: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalSellers
            }
        });

    } catch (error) {
        console.error('Admin system stats error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch system statistics'
        }, { status: 500 });
    }
}