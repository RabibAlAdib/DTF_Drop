import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/User';
import { isAdminUser } from '@/lib/authAdmin';

export async function POST(request) {
  try {
    // Check admin authorization
    if (!(await isAdminUser(request))) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    const { userId, role } = await request.json();
    
    if (!userId || !role) {
      return NextResponse.json({
        success: false,
        message: 'User ID and role are required'
      }, { status: 400 });
    }

    // Validate role
    const validRoles = ['customer', 'seller', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid role specified'
      }, { status: 400 });
    }

    await connectDB();
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: role },
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
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update user role'
    }, { status: 500 });
  }
}