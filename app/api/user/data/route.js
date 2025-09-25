import { getAuth, clerkClient } from "@clerk/nextjs/server"
import connectDB from "@/config/db"
import User from "@/models/User"
import { NextResponse } from 'next/server';

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

        // First try to find user by clerkId (new approach)
        let user = await User.findOne({ clerkId: userId });
        
        // If not found by clerkId, try legacy _id lookup for existing users
        if (!user) {
            try {
                user = await User.findById(userId);
                
                // If found by _id, update with clerkId for future lookups
                if (user) {
                    user.clerkId = userId;
                    await user.save();
                    console.log('Migrated legacy user to use clerkId:', userId);
                }
            } catch (findError) {
                // Handle CastError for legacy ObjectId users - migrate them
                if (findError.name === 'CastError') {
                    console.log('CastError detected for legacy ObjectId user, attempting migration:', userId);
                    
                    try {
                        // Get user data from Clerk to find their email
                        const clerkUser = await clerkClient.users.getUser(userId);
                        const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
                        
                        if (userEmail) {
                            // Find existing user by email and migrate to clerkId
                            const existingUser = await User.findOne({ email: userEmail });
                            if (existingUser) {
                                existingUser.clerkId = userId;
                                await existingUser.save();
                                user = existingUser;
                                console.log('Successfully migrated legacy ObjectId user:', { userId, email: userEmail });
                            } else {
                                console.log('No existing user found with email, will create new:', userEmail);
                                user = null;
                            }
                        } else {
                            console.error('Could not get email from Clerk for user:', userId);
                            user = null;
                        }
                    } catch (migrationError) {
                        console.error('Error during legacy user migration:', migrationError);
                        user = null;
                    }
                } else {
                    throw findError; // Re-throw other database errors
                }
            }
        }

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