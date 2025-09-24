import { NextResponse } from 'next/server';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';

await connectDB();

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User not authenticated"
      }, { status: 401 });
    }

    let user = await User.findById(userId);
    if (!user) {
      // Create user if doesn't exist (first visit)
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        
        const userData = {
          _id: userId,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
          email: clerkUser.emailAddresses[0]?.emailAddress || 'user@example.com',
          imageUrl: clerkUser.imageUrl || 'https://img.clerk.com/preview.png',
          cartItems: {},
          favorites: [],
          joinDate: Date.now()
        };
        
        user = new User(userData);
        await user.save();
      } catch (userCreateError) {
        console.error('Error creating user in favorites GET:', userCreateError);
        return NextResponse.json({
          success: false,
          message: "Unable to create user profile"
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      favorites: user.favorites || []
    });

  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to get favorites"
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "User not authenticated"
      }, { status: 401 });
    }

    const { productId, action } = await request.json();
    
    if (!productId || !action) {
      return NextResponse.json({
        success: false,
        message: "Product ID and action are required"
      }, { status: 400 });
    }

    let user = await User.findById(userId);
    if (!user) {
      // Create user if doesn't exist (first visit)
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        
        const userData = {
          _id: userId,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
          email: clerkUser.emailAddresses[0]?.emailAddress || 'user@example.com',
          imageUrl: clerkUser.imageUrl || 'https://img.clerk.com/preview.png',
          cartItems: {},
          favorites: [],
          joinDate: Date.now()
        };
        
        user = new User(userData);
        await user.save();
      } catch (userCreateError) {
        console.error('Error creating user in favorites POST:', userCreateError);
        return NextResponse.json({
          success: false,
          message: "Unable to create user profile"
        }, { status: 500 });
      }
    }

    if (action === 'add') {
      if (!user.favorites.includes(productId)) {
        user.favorites.push(productId);
        await user.save();
        return NextResponse.json({
          success: true,
          message: "Added to favorites",
          favorites: user.favorites
        });
      } else {
        return NextResponse.json({
          success: false,
          message: "Product already in favorites"
        });
      }
    } else if (action === 'remove') {
      user.favorites = user.favorites.filter(id => id !== productId);
      await user.save();
      return NextResponse.json({
        success: true,
        message: "Removed from favorites",
        favorites: user.favorites
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Invalid action. Use 'add' or 'remove'"
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Favorites action error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to update favorites"
    }, { status: 500 });
  }
}