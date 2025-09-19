import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/User';
import { isAdminUser } from '@/lib/authAdmin';

export async function GET(request) {
  try {
    // Check admin authorization
    if (!(await isAdminUser(request))) {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Max 50 per page
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'all') {
      if (role === 'customer') {
        query.$or = query.$or || [];
        query.$and = [
          ...(query.$or ? [{ $or: query.$or }] : []),
          { $or: [{ role: { $exists: false } }, { role: 'customer' }] }
        ];
        delete query.$or;
      } else {
        query.role = role;
      }
    }
    
    // Get users with pagination
    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select('username email role createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalUsers / limit);
    
    return NextResponse.json({
      success: true,
      users: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      users: [],
      message: 'Failed to fetch users'
    }, { status: 500 });
  }
}