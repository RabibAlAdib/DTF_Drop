import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import { recalculateSalesCount } from '@/lib/salesService';

await connectDB();

/**
 * POST /api/admin/recalculate-sales - Recalculate accurate sales counts for all products
 * This endpoint helps fix any discrepancies in sales counts
 */
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User not authenticated"
      }, { status: 401 });
    }

    // Check if user is admin/seller (you can customize this check)
    const { getToken } = await import('@clerk/nextjs/server');
    const token = await getToken(request);
    
    // Simple check - in production you might want more robust role checking
    const user = await (await import('@clerk/nextjs/server')).clerkClient.users.getUser(userId);
    const isSeller = user?.publicMetadata?.role === 'seller';
    
    if (!isSeller) {
      return NextResponse.json({
        success: false,
        message: "Only sellers can recalculate sales data"
      }, { status: 403 });
    }

    console.log('🔄 Starting sales count recalculation...');
    const result = await recalculateSalesCount();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Sales count recalculated successfully`,
        data: {
          updatedProducts: result.updatedProducts,
          totalOrders: result.totalOrders
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Failed to recalculate sales count",
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Sales count recalculation error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to recalculate sales count"
    }, { status: 500 });
  }
}