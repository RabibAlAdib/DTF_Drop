import User from "@/models/User";
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Universal user lookup that handles all user types:
 * - New users with clerkId
 * - Existing string _id users  
 * - Legacy ObjectId users (via email fallback)
 */
export async function findUserByClerkId(userId) {
    if (!userId) {
        return null;
    }

    // First try to find user by clerkId (preferred approach)
    let user = await User.findOne({ clerkId: userId });
    
    // If not found by clerkId, try legacy _id lookup for existing users
    if (!user) {
        try {
            user = await User.findById(userId);
            
            // If found by _id but no clerkId, update with clerkId for future lookups
            if (user && !user.clerkId) {
                user.clerkId = userId;
                await user.save();
                console.log('Migrated legacy user to include clerkId:', userId);
            }
        } catch (findError) {
            // Handle CastError for legacy ObjectId users
            if (findError.name === 'CastError') {
                console.log('CastError detected for legacy ObjectId user, attempting email lookup:', userId);
                
                try {
                    // Get user data from Clerk to find their email
                    const clerkUser = await clerkClient.users.getUser(userId);
                    const userEmail = clerkUser.emailAddresses[0]?.emailAddress;
                    
                    if (userEmail) {
                        // Find existing user by email (legacy ObjectId users)
                        const existingUser = await User.findOne({ email: userEmail });
                        if (existingUser) {
                            // Migrate to clerkId for future lookups
                            existingUser.clerkId = userId;
                            await existingUser.save();
                            user = existingUser;
                            console.log('Successfully migrated legacy ObjectId user:', { userId, email: userEmail });
                        }
                    }
                } catch (emailLookupError) {
                    console.error('Error during legacy user email lookup:', emailLookupError);
                }
            } else {
                throw findError; // Re-throw other database errors
            }
        }
    }

    return user;
}

/**
 * Update user with universal lookup - handles all user types
 */
export async function updateUserByClerkId(userId, updateData) {
    const user = await findUserByClerkId(userId);
    
    if (!user) {
        return null;
    }
    
    // Update using the actual document _id (handles both string and ObjectId)
    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, { new: true });
    return updatedUser;
}