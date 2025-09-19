import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const authSeller = async (userId) => {
    try {
        if (!userId) {
            return false;
        }

        // Get user from Clerk - using direct access
        const user = await clerkClient().users.getUser(userId);
        
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