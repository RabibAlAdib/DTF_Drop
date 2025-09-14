import { getAuth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * Universal authentication utility that handles both cookie-based and token-based authentication
 * @param {Request} request - The incoming request object
 * @returns {Promise<{userId: string|null, error: string|null}>}
 */
export async function getUniversalAuth(request) {
  try {
    // First try cookie-based authentication (standard Clerk auth)
    const authResult = getAuth(request);
    if (authResult?.userId) {
      return { userId: authResult.userId, error: null };
    }

    // Fallback to Bearer token authentication
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const client = await clerkClient();
        const verifyToken = await client.verifyToken(token);
        
        if (verifyToken?.sub) {
          return { userId: verifyToken.sub, error: null };
        }
      } catch (tokenError) {
        console.warn('Bearer token verification failed:', tokenError.message);
        return { userId: null, error: 'Invalid bearer token' };
      }
    }

    // No authentication found
    return { userId: null, error: 'No authentication provided' };

  } catch (error) {
    console.error('Authentication error:', error);
    return { userId: null, error: 'Authentication failed' };
  }
}

/**
 * Middleware to check if user is authenticated and is a seller
 * @param {Request} request - The incoming request object
 * @returns {Promise<{userId: string|null, isSeller: boolean, error: string|null}>}
 */
export async function getSellerAuth(request) {
  const { userId, error } = await getUniversalAuth(request);
  
  if (!userId || error) {
    return { userId: null, isSeller: false, error: error || 'Authentication required' };
  }

  try {
    const { default: authSeller } = await import('@/lib/authSeller');
    const isSeller = await authSeller(userId);
    
    return { 
      userId, 
      isSeller, 
      error: isSeller ? null : 'Only sellers are authorized for this action' 
    };
  } catch (authError) {
    return { 
      userId, 
      isSeller: false, 
      error: 'Failed to verify seller status' 
    };
  }
}