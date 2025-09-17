import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Admin authentication middleware - Only allows "dtfdrop_admin" user
 * @param {Request} request - The incoming request object
 * @returns {Promise<{userId: string|null, isAdmin: boolean, user: object|null, error: string|null}>}
 */
export async function getAdminAuth(request) {
    try {
        const { userId } = getAuth(request);
        
        if (!userId) {
            return {
                userId: null,
                isAdmin: false, 
                user: null,
                error: 'Authentication required'
            };
        }

        // Get user details from Clerk
        const user = await clerkClient.users.getUser(userId);
        
        // Check if user is the admin user (by username OR user ID for security)
        const adminUsername = 'dtfdrop_admin';
        const adminUserId = process.env.ADMIN_USER_ID; // Fallback to env var for security
        
        const isAdmin = user.username === adminUsername || 
                       (adminUserId && userId === adminUserId);
        
        if (!isAdmin) {
            return {
                userId,
                isAdmin: false,
                user,
                error: 'Admin access denied. Only dtfdrop_admin user is authorized.'
            };
        }

        return {
            userId,
            isAdmin: true,
            user,
            error: null
        };

    } catch (error) {
        console.error('Admin authentication error:', error);
        return {
            userId: null,
            isAdmin: false,
            user: null,
            error: 'Admin authentication failed'
        };
    }
}

/**
 * Simple admin check function for components
 * @param {string} userId - User ID from Clerk
 * @returns {Promise<boolean>}
 */
export async function isAdminUser(userId) {
    try {
        if (!userId) return false;
        
        const user = await clerkClient.users.getUser(userId);
        const adminUsername = 'dtfdrop_admin';
        const adminUserId = process.env.ADMIN_USER_ID;
        
        return user.username === adminUsername || 
               (adminUserId && userId === adminUserId);
    } catch (error) {
        console.error('Admin check error:', error);
        return false;
    }
}

export default getAdminAuth;