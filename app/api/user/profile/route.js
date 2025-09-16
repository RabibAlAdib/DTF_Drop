import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';
import Order from '@/models/Order';

await connectDB();

// GET /api/user/profile - Get user profile with stats
export async function GET() {
  try {
    const { userId } = auth();
    const clerkUser = await currentUser();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    // Get user from database
    let dbUser = await User.findOne({ userId });
    
    // Create user if doesn't exist (sync with Clerk)
    if (!dbUser) {
      dbUser = new User({
        userId,
        name: clerkUser.fullName || `${clerkUser.firstName} ${clerkUser.lastName}`,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        cartItems: []
      });
      await dbUser.save();
    }

    // Get user's order statistics
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders
        .filter(order => ['paid', 'pending'].includes(order.payment.status))
        .reduce((sum, order) => sum + order.pricing.totalAmount, 0),
      completedOrders: orders.filter(order => order.status === 'delivered').length,
      pendingOrders: orders.filter(order => 
        ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery'].includes(order.status)
      ).length,
      cancelledOrders: orders.filter(order => order.status === 'cancelled').length,
      returnedOrders: orders.filter(order => order.status === 'returned').length
    };

    // Get recent orders (last 5)
    const recentOrders = orders.slice(0, 5).map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.pricing.totalAmount,
      itemCount: order.items.length,
      createdAt: order.createdAt,
      items: order.items.slice(0, 2).map(item => ({
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity
      }))
    }));

    // Get user preferences and activity
    const userProfile = {
      // Basic info from Clerk
      id: clerkUser.id,
      name: clerkUser.fullName || `${clerkUser.firstName} ${clerkUser.lastName}`,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      imageUrl: clerkUser.imageUrl,
      createdAt: clerkUser.createdAt,
      
      // Database info
      dbUser: {
        _id: dbUser._id,
        joinDate: dbUser.createdAt,
        lastActive: dbUser.updatedAt,
        cartItems: dbUser.cartItems?.length || 0
      },
      
      // Order statistics
      stats,
      
      // Recent activity
      recentOrders
    };

    return NextResponse.json({
      success: true,
      profile: userProfile
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch user profile'
    }, { status: 500 });
  }
}

// PUT /api/user/profile - Update user preferences
export async function PUT(req) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "Authentication required" 
      }, { status: 401 });
    }

    const { preferences } = await req.json();
    
    // Update user preferences in database
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { 
        preferences: {
          notifications: preferences?.notifications || true,
          marketing: preferences?.marketing || false,
          orderUpdates: preferences?.orderUpdates || true
        },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      preferences: updatedUser.preferences
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update profile'
    }, { status: 500 });
  }
}