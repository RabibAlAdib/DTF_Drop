import { NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/backend';
import { isAdminUser } from '@/lib/authAdmin';

export async function POST(request) {
  try {
    // Check if user is admin
    const isAdmin = await isAdminUser(request);
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        message: "Admin access required"
      }, { status: 403 });
    }

    const clerkClient = createClerkClient({ 
      secretKey: process.env.CLERK_SECRET_KEY 
    });

    // Get all users from Clerk with pagination
    let updatedCount = 0;
    let skippedCount = 0;
    let totalProcessed = 0;
    const results = [];
    const batchSize = 50; // Process 50 users at a time
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const userBatch = await clerkClient.users.getUserList({
        limit: batchSize,
        offset: offset
      });

      if (userBatch.data.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`Processing users batch: ${offset + 1} to ${offset + userBatch.data.length}`);

      for (const user of userBatch.data) {
        try {
          totalProcessed++;
          
          // Check if user already has a role
          if (!user.publicMetadata?.role) {
            // Check if user is the admin email
            const primaryEmail = user.emailAddresses?.find(email => 
              email.id === user.primaryEmailAddressId
            )?.emailAddress;
            
            if (primaryEmail === 'dtfdrop25@gmail.com') {
              // Skip admin user
              results.push({
                userId: user.id,
                email: primaryEmail,
                action: 'skipped',
                reason: 'admin user'
              });
              skippedCount++;
              continue;
            }

            // Assign customer role
            await clerkClient.users.updateUser(user.id, {
              publicMetadata: {
                ...user.publicMetadata,
                role: 'customer'
              }
            });

            results.push({
              userId: user.id,
              email: primaryEmail,
              action: 'assigned',
              role: 'customer'
            });
            updatedCount++;
            
            console.log(`Assigned customer role to existing user: ${user.id} (${primaryEmail})`);
            
          } else {
            results.push({
              userId: user.id,
              email: user.emailAddresses?.[0]?.emailAddress,
              action: 'skipped',
              reason: `already has role: ${user.publicMetadata.role}`
            });
            skippedCount++;
          }
        } catch (userError) {
          console.error(`Error updating user ${user.id}:`, userError);
          results.push({
            userId: user.id,
            action: 'error',
            error: userError.message
          });
        }
      }

      // Update offset for next batch
      offset += userBatch.data.length;

      // If we got fewer users than requested, we've reached the end
      if (userBatch.data.length < batchSize) {
        hasMore = false;
      }

      // Add a small delay to avoid rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Role assignment completed. Updated: ${updatedCount}, Skipped: ${skippedCount}, Total: ${totalProcessed}`,
      details: {
        updatedCount,
        skippedCount,
        totalUsers: totalProcessed,
        results: results.slice(0, 100) // Limit results for response size
      }
    });

  } catch (error) {
    console.error('Error in assign-customer-roles:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to assign customer roles',
      error: error.message
    }, { status: 500 });
  }
}