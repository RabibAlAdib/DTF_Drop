import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const authSeller = async (userId) => {
    try {
        if (!userId) {
            return false;
        }

        const client = clerkClient();
        const user = await client.users.getUser(userId)

        if (user.publicMetadata.role === 'seller') {
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