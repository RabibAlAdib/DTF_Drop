import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/database';
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

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
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

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        message: "User not found"
      }, { status: 404 });
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