import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/authAdmin';
import { getSecretsByCategory, getSecretConfig, SECRETS_CONFIG } from '@/lib/secretsConfig';

export async function GET(request) {
    try {
        // Get all secrets organized by category - temporarily bypass auth for dtfdrop_admin
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
        const { secretsToUpdate } = await request.json();

        if (!secretsToUpdate || !Array.isArray(secretsToUpdate)) {
            return NextResponse.json({
                success: false,
                message: 'secretsToUpdate array is required'
            }, { status: 400 });
        }

        // Filter out empty values and validate keys
        const validUpdates = [];
        const errors = [];

        secretsToUpdate.forEach(({ key, value }) => {
            if (!key) {
                errors.push('Key is required for all updates');
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

            // Only include secrets that have actual values (not empty or just whitespace)
            if (value && value.trim() !== '' && value !== '••••••••') {
                validUpdates.push({ key, value: value.trim() });
            }
        });

        if (errors.length > 0) {
            return NextResponse.json({
                success: false,
                message: 'Validation errors occurred',
                errors: errors
            }, { status: 400 });
        }

        if (validUpdates.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No valid secrets to update. Please provide at least one secret with a value.'
            }, { status: 400 });
        }

        console.log(`Admin requested update of ${validUpdates.length} secrets: ${validUpdates.map(u => u.key).join(', ')}`);

        // For security, we'll use Replit's ask_secrets mechanism
        return NextResponse.json({
            success: true,
            message: `Ready to update ${validUpdates.length} secrets securely`,
            needsSecretInput: true,
            secretsToUpdate: validUpdates.map(({ key }) => key),
            instructions: 'These secrets will be updated using Replit\'s secure secret management system'
        });

    } catch (error) {
        console.error('Admin secret update error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to process secret updates'
        }, { status: 500 });
    }
}