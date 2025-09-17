import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/authAdmin';
import { getSecretsByCategory, getSecretConfig } from '@/lib/secretsConfig';

export async function GET(request) {
    try {
        // Check admin authentication
        const { userId, isAdmin, error } = await getAdminAuth(request);
        
        if (!userId || !isAdmin || error) {
            return NextResponse.json({
                success: false,
                message: error || 'Admin access required'
            }, { status: 403 });
        }

        // Get all secrets organized by category
        const secretsByCategory = getSecretsByCategory();
        
        // For each secret, check if it's currently set and provide status information
        const secretsWithStatus = {};
        
        Object.entries(secretsByCategory).forEach(([category, secrets]) => {
            secretsWithStatus[category] = secrets.map(secret => ({
                ...secret,
                isSet: !!process.env[secret.key],
                // SECURITY: Never return actual secret values to client
                lastUpdated: null // Could be enhanced to track update times
            }));
        });

        return NextResponse.json({
            success: true,
            secrets: secretsWithStatus,
            totalSecrets: Object.values(secretsByCategory).flat().length,
            setSecrets: Object.values(secretsByCategory).flat().filter(s => process.env[s.key]).length
        });

    } catch (error) {
        console.error('Admin secrets fetch error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch secrets configuration'
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        // Check admin authentication  
        const { userId, isAdmin, error } = await getAdminAuth(request);
        
        if (!userId || !isAdmin || error) {
            return NextResponse.json({
                success: false,
                message: error || 'Admin access required'
            }, { status: 403 });
        }

        const { key, value } = await request.json();

        if (!key || value === undefined) {
            return NextResponse.json({
                success: false,
                message: 'Key and value are required'
            }, { status: 400 });
        }

        // Validate the key using our centralized config
        const secretConfig = getSecretConfig(key);
        if (!secretConfig || secretConfig.internal) {
            return NextResponse.json({
                success: false,
                message: 'Invalid or restricted secret key'
            }, { status: 400 });
        }

        // Log the update attempt (don't log sensitive values)
        console.log(`Admin ${userId} attempted to update ${key} in category ${secretConfig.category}`);

        // IMPORTANT: This is still a demonstration endpoint
        // In production, you would integrate with your deployment platform's API
        // Examples:
        // - Vercel: Use Vercel API to update environment variables
        // - AWS: Update Parameter Store or Secrets Manager
        // - Docker: Update container environment variables
        // - Kubernetes: Update ConfigMaps or Secrets
        
        return NextResponse.json({
            success: false, // Still in demo mode
            message: `Secret Management is currently in demo mode`,
            note: 'To enable real secret management, integrate with your deployment platform API',
            demo: true,
            secretInfo: {
                key: key,
                category: secretConfig.category,
                description: secretConfig.description,
                required: secretConfig.required
            }
        });

    } catch (error) {
        console.error('Admin secret update error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to update secret'
        }, { status: 500 });
    }
}