import { clerkClient, getAuth } from '@clerk/nextjs/server';

/**
 * Secure admin authentication - Uses Clerk's immutable data only
 * Checks against Clerk's primary email address, not mutable database fields
 */
export const isAdminUser = async (request) => {
  try {
    const { userId } = getAuth(request);
    if (!userId) return false;
    
    // Get user data directly from Clerk (trusted source)
    const user = await clerkClient.users.getUser(userId);
    if (!user) return false;
    
    // Check against Clerk's primary email only (most secure approach)
    const primaryEmail = user.emailAddresses?.find(email => email.id === user.primaryEmailAddressId)?.emailAddress;
    
    // Admin allowlist - only based on verified email address
    // Email addresses are verified by Clerk and cannot be claimed by other users
    return primaryEmail === 'dtfdrop25@gmail.com';
    
  } catch (error) {
    console.error('Admin auth error:', error);
    return false;
  }
};