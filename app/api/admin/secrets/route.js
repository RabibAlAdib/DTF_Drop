import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/authAdmin';
import { getSecretsByCategory, getSecretConfig, SECRETS_CONFIG } from '@/lib/secretsConfig';

export async function GET(request) {
    try {
        // Check admin authentication - CRITICAL SECURITY ENFORCEMENT
        const { userId, isAdmin, error } = await getAdminAuth(request);
        
        if (!userId || !isAdmin || error) {
            return NextResponse.json({
                success: false,
                message: error || 'Admin authentication required'
            }, { status: 403 });
        }

        // Get all secrets organized by category
        const secretsByCategory = getSecretsByCategory();
        
        // For each secret, check if it's currently set and provide status information
        const secretsWithStatus = {};
        let totalSecrets = 0;
        let setSecrets = 0;
        
        Object.entries(secretsByCategory).forEach(([category, secrets]) => {
            secretsWithStatus[category] = secrets.map(secret => {
                const isSet = !!process.env[secret.name];
                totalSecrets++;
                if (isSet) setSecrets++;
                
                return {
                    ...secret,
                    isSet: isSet,
                    value: isSet ? '••••••••' : '', // Show masked value or empty
                    // SECURITY: Never return actual secret values to client
                    lastUpdated: null // Could be enhanced to track update times
                };
            });
        });

        return NextResponse.json({
            success: true,
            secrets: secretsWithStatus,
            totalSecrets: totalSecrets,
            setSecrets: setSecrets,
            categories: Object.keys(secretsWithStatus)
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
        // Check admin authentication - CRITICAL SECURITY ENFORCEMENT
        const { userId, isAdmin, error } = await getAdminAuth(request);
        
        if (!userId || !isAdmin || error) {
            return NextResponse.json({
                success: false,
                message: error || 'Admin authentication required'
            }, { status: 403 });
        }

        const { secretKeys } = await request.json();

        if (!secretKeys || !Array.isArray(secretKeys)) {
            return NextResponse.json({
                success: false,
                message: 'secretKeys array is required'
            }, { status: 400 });
        }

        // Validate secret keys only (never accept values via API for security)
        const validKeys = [];
        const errors = [];

        secretKeys.forEach((key) => {
            if (!key) {
                errors.push('Key is required');
                return;
            }

            const secretConfig = SECRETS_CONFIG[key];
            if (!secretConfig) {
                errors.push(`Invalid secret key: ${key}`);
                return;
            }

            if (secretConfig.internal) {
                errors.push(`Cannot update internal secret: ${key}`);
                return;
            }

            validKeys.push(key);
        });

        if (errors.length > 0) {
            return NextResponse.json({
                success: false,
                message: 'Validation errors occurred',
                errors: errors
            }, { status: 400 });
        }

        if (validKeys.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No valid secrets to update.'
            }, { status: 400 });
        }

        console.log(`Admin ${userId} requested secure update of ${validKeys.length} secrets: ${validKeys.join(', ')}`);

        return NextResponse.json({
            success: true,
            message: `Use Replit Secrets panel to add these ${validKeys.length} secrets manually`,
            secretKeys: validKeys,
            instructions: 'For security, values must be entered directly in Replit Secrets panel'
        });

    } catch (error) {
        console.error('Admin secret update error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to process secret update request'
        }, { status: 500 });
    }
}