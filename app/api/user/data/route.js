import { getAuth, clerkClient } from "@clerk/nextjs/server"
import connectDB from "@/config/db"
import User from "@/models/User"
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        // console.log("Fetching user data...")
        // console.log(request)
        const {userId } = getAuth(request)
        
        // Check if user is authenticated
        if (!userId) {
            return NextResponse.json({
                success: false, 
                message: "User not authenticated"
            }, { status: 401 });
        }
        
        await connectDB()

        let user = await User.findById(userId)

        if (!user) {
            // Create user if doesn't exist (first visit)
            try {
                // Get user data from Clerk - correct API usage
                const client = await clerkClient()
                const clerkUser = await client.users.getUser(userId)
                
                const userData = {
                    _id: userId,
                    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
                    email: clerkUser.emailAddresses[0]?.emailAddress || 'user@example.com',
                    imageUrl: clerkUser.imageUrl || 'https://img.clerk.com/preview.png',
                    cartItems: {},
                    joinDate: Date.now()
                }
                
                user = new User(userData)
                await user.save()
            } catch (userCreateError) {
                console.error('Error creating user:', userCreateError);
                // Return error response if user creation fails
                return NextResponse.json({
                    success: false, 
                    message: "Unable to create user profile"
                }, { status: 500 });
            }
        }

        return NextResponse.json({success:true, user})

    } catch (error) {
        console.error('User data fetch error:', error);
        return NextResponse.json({success:false, message: "Unable to fetch user data"})
    }
}