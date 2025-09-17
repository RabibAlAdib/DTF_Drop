import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request) {
    try {
        const user = await currentUser();
        
        return NextResponse.json({
            success: true,
            user: user ? {
                id: user.id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                emailAddresses: user.emailAddresses?.map(e => e.emailAddress) || [],
                publicMetadata: user.publicMetadata,
                createdAt: user.createdAt
            } : null,
            isAuthenticated: !!user
        });
    } catch (error) {
        console.error('Debug user error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            user: null,
            isAuthenticated: false
        });
    }
}