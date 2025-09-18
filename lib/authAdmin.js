import { getAuth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';

/**
 * Universal admin authentication - handles both session and token-based auth
 */
export const isAdminUser = async (request) => {
  try {
    let userId = null;
    
    // Try standard session auth first
    const authResult = getAuth(request);
    if (authResult?.userId) {
      userId = authResult.userId;
    } else {
      // Try Bearer token authentication
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const clerkClient = createClerkClient({ 
          secretKey: process.env.CLERK_SECRET_KEY 
        });
        try {
          const verifyResult = await clerkClient.verifyToken(token);
          if (verifyResult?.sub) {
            userId = verifyResult.sub;
          }
        } catch (tokenError) {
          console.log('Token verification failed:', tokenError.message);
        }
      }
    }
    
    if (!userId) {
      return false;
    }
    
    // Get user data from Clerk
    const clerkClient = createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY 
    });
    const user = await clerkClient.users.getUser(userId);
    
    if (!user) {
      return false;
    }
    
    // Check against Clerk's primary email
    const primaryEmail = user.emailAddresses?.find(email => email.id === user.primaryEmailAddressId)?.emailAddress;
    
    return primaryEmail === 'dtfdrop25@gmail.com';
    
  } catch (error) {
    console.error('Admin auth error:', error);
    return false;
  }
};