import { createClerkClient } from '@clerk/backend';
import { NextResponse } from 'next/server';

const authSeller = async (userId) => {
    try {
        if (!userId) {
            return false;
        }

        // Get user from Clerk - create client properly
        const clerkClient = createClerkClient({ 
            secretKey: process.env.CLERK_SECRET_KEY 
        });
        const user = await clerkClient.users.getUser(userId);
        
        // Check if user is admin first (admin has all privileges)
        const primaryEmail = user.emailAddresses?.find(email => email.id === user.primaryEmailAddressId)?.emailAddress;
        if (primaryEmail === 'dtfdrop25@gmail.com') {
            return true; // Admin user has seller privileges
        }

        // Check if user is a regular seller
        if (user?.publicMetadata?.role === 'seller') {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Seller authentication error:', error);
        return false;
    }
}

export default authSeller;