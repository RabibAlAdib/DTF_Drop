import { getAuth, clerkClient } from "@clerk/nextjs/server"
import connectDB from "@/config/db"
import User from "@/models/User"
import { NextResponse } from 'next/server';
import { findUserByClerkId } from "@/lib/userLookup";

export async function GET(request) {
    let userId = null;
    
    try {
        // console.log("Fetching user data...")
        // console.log(request)
        const authResult = getAuth(request);
        userId = authResult.userId;
        
        // Check if user is authenticated
        if (!userId) {
            return NextResponse.json({
                success: false, 
                message: "User not authenticated"
            }, { status: 401 });
        }
        
        await connectDB()

        // Use the centralized user lookup helper
        let user = await findUserByClerkId(userId);

        if (!user) {
            // Create user if doesn't exist (first visit)
            try {
                // Get user data from Clerk - correct API usage
                const clerkUser = await clerkClient.users.getUser(userId)
                
                const userData = {
                    _id: userId,
                    clerkId: userId, // Add clerkId for future lookups
                    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
                    email: clerkUser.emailAddresses[0]?.emailAddress || 'user@example.com',
                    imageUrl: clerkUser.imageUrl || 'https://img.clerk.com/preview.png',
                    cartItems: {},
                    joinDate: Date.now()
                }
                
                user = new User(userData)
                await user.save()
            } catch (userCreateError) {
                console.error('=== User creation failed ===');
                console.error('UserId:', userId);
                console.error('Error message:', userCreateError.message);
                console.error('Error name:', userCreateError.name);
                
                // Safe error details extraction
                const errorDetails = {
                    message: userCreateError.message,
                    name: userCreateError.name,
                    code: userCreateError.code,
                    stack: process.env.NODE_ENV === 'development' ? userCreateError.stack : 'hidden'
                };
                console.error('Error details:', errorDetails);
                
                return NextResponse.json({
                    success: false, 
                    message: "Unable to create user profile",
                    debug: process.env.NODE_ENV === 'development' ? userCreateError.message : undefined
                }, { status: 500 });
            }
        }

        return NextResponse.json({success:true, user})

    } catch (error) {
        console.error('=== User data fetch error ===');
        console.error('UserId:', userId || 'N/A');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        // Safe error details
        const safeErrorDetails = {
            name: error.name,
            message: error.message,
            code: error.code,
            isNetworkError: error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED'),
            isAuthError: error.message?.includes('clerk') || error.message?.includes('authentication'),
            isDatabaseError: error.message?.includes('mongo') || error.message?.includes('connection'),
            stack: process.env.NODE_ENV === 'development' ? error.stack?.slice(0, 500) : 'hidden' // Limit stack trace
        };
        
        console.error('Error analysis:', safeErrorDetails);
        
        return NextResponse.json({
            success: false, 
            message: "Unable to fetch user data",
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}