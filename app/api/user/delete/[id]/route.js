import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/User';

export async function DELETE(request, { params }) {
  try {
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    await connectDB();
    
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete user'
    }, { status: 500 });
  }
}