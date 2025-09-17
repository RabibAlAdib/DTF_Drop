import { getAuth, clerkClient } from "@clerk/nextjs/server";

/**
 * Admin authentication middleware - Only allows "dtfdrop_admin" user
 * @param {Request} request - The incoming request object
 * @returns {Promise<{userId: string|null, isAdmin: boolean, user: object|null, error: string|null}>}
 */
export async function getAdminAuth(request) {
    try {
        // Try multiple authentication methods
        let userId = null;
        
        // Method 1: Cookie-based authentication (standard for same-origin Next.js)
        const authResult = getAuth(request);
        if (authResult?.userId) {
            userId = authResult.userId;
            console.log('Admin auth debug - userId from cookies:', userId);
        }
        
        // Method 2: If cookie auth fails, try session token from headers
        if (!userId) {
            const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                try {
                    const token = authHeader.substring(7);
                    // Use backend client for token verification
                    const { createClerkClient } = await import('@clerk/backend');
                    const backend = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
                    const verifyToken = await backend.verifyToken(token);
                    if (verifyToken?.sub) {
                        userId = verifyToken.sub;
                        console.log('Admin auth debug - userId from Bearer token:', userId);
                    }
                } catch (tokenError) {
                    console.log('Admin auth debug - Bearer token failed:', tokenError.message);
                }
            }
        }
        
        // Method 3: Check if request has session ID in query params (fallback)
        if (!userId) {
            const url = new URL(request.url);
            const sessionId = url.searchParams.get('session_id');
            if (sessionId) {
                try {
                    const session = await clerkClient.sessions.getSession(sessionId);
                    if (session?.userId) {
                        userId = session.userId;
                        console.log('Admin auth debug - userId from session_id:', userId);
                    }
                } catch (sessionError) {
                    console.log('Admin auth debug - Session ID failed:', sessionError.message);
                }
            }
        }

        if (!userId) {
            console.log('Admin auth debug - No userId found, user not authenticated');
            return {
                userId: null,
                isAdmin: false,
                user: null,
                error: "Authentication required - Please sign in",
            };
        }

        // Get user details from Clerk
        const user = await clerkClient.users.getUser(userId);
        console.log('Admin auth debug - user:', { id: user.id, username: user.username });

        // Check if user is the admin user (by username OR user ID for security)
        const adminUsername = "dtfdrop_admin";
        const adminUserId = process.env.ADMIN_USER_ID; // Fallback to env var for security
        // Debug logs removed for security
        const isAdmin =
            user.username === adminUsername ||
            (adminUserId && userId === adminUserId);
        
        // Admin access verified

        if (!isAdmin) {
            return {
                userId,
                isAdmin: false,
                user,
                error: "Admin access denied. Only dtfdrop_admin user is authorized.",
            };
        }

        return {
            userId,
            isAdmin: true,
            user,
            error: null,
        };
    } catch (error) {
        console.error("Admin authentication error:", error);
        return {
            userId: null,
            isAdmin: false,
            user: null,
            error: "Admin authentication failed",
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
        const adminUsername = "dtfdrop_admin";
        const adminUserId = process.env.ADMIN_USER_ID;

        return (
            user.username === adminUsername ||
            (adminUserId && userId === adminUserId)
        );
    } catch (error) {
        console.error("Admin check error:", error);
        return false;
    }
}

export default getAdminAuth;
