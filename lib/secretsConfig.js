// Centralized Secrets Configuration
// This file defines all the secrets/environment variables used throughout the application

export const SECRETS_CONFIG = {
  // Authentication & User Management
  CLERK_SECRET_KEY: {
    name: 'CLERK_SECRET_KEY',
    description: 'Clerk authentication secret key',
    category: 'Authentication',
    required: true,
    example: 'sk_test_...'
  },
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {
    name: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 
    description: 'Clerk publishable key for client-side',
    category: 'Authentication',
    required: true,
    example: 'pk_test_...'
  },

  // Database
  MONGODB_URI: {
    name: 'MONGODB_URI',
    description: 'MongoDB connection string',
    category: 'Database',
    required: true,
    example: 'mongodb+srv://...'
  },

  // Cloud Storage
  CLOUDINARY_CLOUD_NAME: {
    name: 'CLOUDINARY_CLOUD_NAME',
    description: 'Cloudinary cloud name for image storage',
    category: 'Storage',
    required: true,
    example: 'your-cloud-name'
  },
  CLOUDINARY_API_KEY: {
    name: 'CLOUDINARY_API_KEY',
    description: 'Cloudinary API key',
    category: 'Storage', 
    required: true,
    example: '123456789012345'
  },
  CLOUDINARY_API_SECRET: {
    name: 'CLOUDINARY_API_SECRET',
    description: 'Cloudinary API secret',
    category: 'Storage',
    required: true,
    example: 'abcdef...'
  },

  // Background Processing
  INNGEST_SIGNING_KEY: {
    name: 'INNGEST_SIGNING_KEY',
    description: 'Inngest webhook signing key',
    category: 'Background Processing',
    required: true,
    example: 'signkey-...'
  },
  INNGEST_EVENT_KEY: {
    name: 'INNGEST_EVENT_KEY', 
    description: 'Inngest event API key',
    category: 'Background Processing',
    required: true,
    example: 'test_...'
  },

  // Email Configuration
  EMAIL_HOST: {
    name: 'EMAIL_HOST',
    description: 'SMTP server hostname',
    category: 'Email',
    required: false,
    example: 'smtp.gmail.com'
  },
  EMAIL_PORT: {
    name: 'EMAIL_PORT',
    description: 'SMTP server port',
    category: 'Email', 
    required: false,
    example: '587'
  },
  EMAIL_USER: {
    name: 'EMAIL_USER',
    description: 'SMTP username/email',
    category: 'Email',
    required: false,
    example: 'your-email@gmail.com'
  },
  EMAIL_PASS: {
    name: 'EMAIL_PASS',
    description: 'SMTP password or app password',
    category: 'Email',
    required: false,
    example: 'your-app-password'
  },

  // Payment Gateways
  BKASH_API_KEY: {
    name: 'BKASH_API_KEY',
    description: 'bKash payment API key',
    category: 'Payment',
    required: false,
    example: 'bkash_...'
  },
  BKASH_API_SECRET: {
    name: 'BKASH_API_SECRET', 
    description: 'bKash payment API secret',
    category: 'Payment',
    required: false,
    example: 'bkash_secret_...'
  },
  NAGAD_MERCHANT_ID: {
    name: 'NAGAD_MERCHANT_ID',
    description: 'Nagad payment merchant ID', 
    category: 'Payment',
    required: false,
    example: '123456789'
  },
  NAGAD_PUBLIC_KEY: {
    name: 'NAGAD_PUBLIC_KEY',
    description: 'Nagad payment public key',
    category: 'Payment', 
    required: false,
    example: 'nagad_pk_...'
  },

  // Application Settings
  NEXT_PUBLIC_CURRENCY: {
    name: 'NEXT_PUBLIC_CURRENCY',
    description: 'Default currency symbol for the application',
    category: 'App Settings',
    required: false,
    example: 'BDT '
  },

  // Admin Settings (Internal)
  ADMIN_USER_ID: {
    name: 'ADMIN_USER_ID',
    description: 'Fallback admin user ID for secure admin identification',
    category: 'Admin',
    required: false,
    example: 'user_...',
    internal: true // Not shown in admin panel
  }
};

// Get secrets by category
export function getSecretsByCategory() {
  const categories = {};
  
  Object.entries(SECRETS_CONFIG).forEach(([key, config]) => {
    if (config.internal) return; // Skip internal secrets
    
    if (!categories[config.category]) {
      categories[config.category] = [];
    }
    categories[config.category].push({
      key,
      ...config
    });
  });
  
  return categories;
}

// Get all secret keys (for validation)
export function getAllSecretKeys() {
  return Object.keys(SECRETS_CONFIG);
}

// Get public secret keys (excluding internal ones)
export function getPublicSecretKeys() {
  return Object.entries(SECRETS_CONFIG)
    .filter(([_, config]) => !config.internal)
    .map(([key, _]) => key);
}

// Check if a key is valid
export function isValidSecretKey(key) {
  return getAllSecretKeys().includes(key);
}

// Get secret configuration
export function getSecretConfig(key) {
  return SECRETS_CONFIG[key] || null;
}